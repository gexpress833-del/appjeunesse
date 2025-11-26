// Système d'export PDF professionnel pour les rapports de présences
// Utilise jsPDF avec autoTable pour des rapports de niveau entreprise

class PDFReportGenerator {
  constructor() {
    this.loadJsPDF();
    this.companyInfo = {
      name: "La Parole Eternelle",
      address: "Kolwezi, République Démocratique du Congo",
      phone: "+243 XXX XXX XXX",
      email: "contact@laparole.cd",
      website: "www.laparole.cd"
    };
    this.colors = {
      primary: [0, 212, 255],      // Cyan
      secondary: [124, 58, 237],   // Violet
      accent: [6, 255, 165],       // Vert néon
      dark: [15, 15, 35],          // Fond sombre
      light: [226, 232, 240],      // Texte clair
      muted: [136, 146, 176]       // Texte atténué
    };
  }

  // Vérifier les permissions d'export PDF
  checkExportPermissions() {
    const currentRole = localStorage.getItem('appRole');
    const authorizedRoles = ['admin', 'secretariat'];
    
    if (!authorizedRoles.includes(currentRole)) {
      const roleLabels = {
        'responsable': 'Responsable',
        'user': 'Utilisateur'
      };
      
      throw new Error(`Accès refusé. Seuls l'Administrateur et le Secrétariat peuvent exporter des rapports PDF. Votre rôle actuel : ${roleLabels[currentRole] || currentRole}`);
    }
    
    return true;
  }

  // Charger jsPDF et autoTable
  loadJsPDF() {
    if (typeof window.jsPDF === 'undefined') {
      // Charger jsPDF depuis CDN
      const script1 = document.createElement('script');
      script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
      document.head.appendChild(script2);
    }
  }

  // Attendre que jsPDF soit chargé (optimisé)
  async waitForJsPDF() {
    if (typeof window.jsPDF !== 'undefined' && window.jsPDF.jsPDF) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 secondes max
      
      const checkJsPDF = () => {
        attempts++;
        if (typeof window.jsPDF !== 'undefined' && window.jsPDF.jsPDF) {
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(checkJsPDF, 100);
        } else {
          reject(new Error('Timeout: jsPDF n\'a pas pu être chargé'));
        }
      };
      checkJsPDF();
    });
  }

  // Cache pour les données fréquemment utilisées
  getCachedData() {
    if (!this.dataCache || Date.now() - this.dataCacheTime > 30000) { // Cache 30s
      this.dataCache = {
        members: JSON.parse(localStorage.getItem('members') || '[]'),
        events: JSON.parse(localStorage.getItem('events') || '[]'),
        attendances: JSON.parse(localStorage.getItem('attendances') || '[]'),
        departments: JSON.parse(localStorage.getItem('departments') || '[]')
      };
      this.dataCacheTime = Date.now();
    }
    return this.dataCache;
  }

  // Afficher le progrès de génération
  showProgress(message, percentage) {
    if (window.notificationSystem) {
      // Utiliser le système de notifications existant
      if (this.currentProgressNotification) {
        window.notificationSystem.dismiss(this.currentProgressNotification);
      }
      this.currentProgressNotification = window.notificationSystem.info(
        `${message} (${percentage}%)`, 
        { duration: 1000, persistent: percentage < 100 }
      );
    }
    
    // Mettre à jour l'overlay de chargement s'il existe
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay && loadingOverlay.style.display !== 'none') {
      const progressText = loadingOverlay.querySelector('p');
      if (progressText) {
        progressText.textContent = `${message} (${percentage}%)`;
      }
    }
  }

  // Masquer le progrès
  hideProgress() {
    if (this.currentProgressNotification && window.notificationSystem) {
      window.notificationSystem.dismiss(this.currentProgressNotification);
      this.currentProgressNotification = null;
    }
  }

  // Traitement optimisé des données d'événement
  processEventData(eventId, members, attendances) {
    const eventAttendances = attendances.filter(a => a.eventId == eventId);
    
    // Créer un map pour un accès rapide aux présences
    const attendanceMap = new Map();
    eventAttendances.forEach(att => {
      attendanceMap.set(att.memberId, att.status);
    });
    
    // Traiter les membres avec leurs présences
    const processedMembers = members.map(member => ({
      ...member,
      status: attendanceMap.get(member.id) || 'N/A',
      statusLabel: this.getStatusLabel(attendanceMap.get(member.id) || 'N/A')
    }));
    
    // Calculer les statistiques en une seule passe
    const stats = {
      total: members.length,
      present: 0,
      absent: 0,
      excused: 0
    };
    
    eventAttendances.forEach(att => {
      switch(att.status) {
        case 'P': stats.present++; break;
        case 'A': stats.absent++; break;
        case 'AJ': stats.excused++; break;
      }
    });
    
    stats.rate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;
    
    return { processedMembers, stats, eventAttendances };
  }

  // Obtenir le libellé du statut
  getStatusLabel(status) {
    const statusLabels = {
      'P': 'Présent',
      'A': 'Absent', 
      'AJ': 'Absent Justifié',
      'N/A': 'Non enregistré'
    };
    return statusLabels[status] || status;
  }

  // Ajouter l'en-tête professionnel
  addHeader(doc, title, subtitle = '') {
    const pageWidth = doc.internal.pageSize.width;
    
    // Fond dégradé pour l'en-tête
    doc.setFillColor(...this.colors.primary);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Logo et nom de l'entreprise
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('🏛️ ' + this.companyInfo.name, 20, 25);
    
    // Titre du rapport
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 20, 35);
    
    if (subtitle) {
      doc.setFontSize(12);
      doc.setTextColor(200, 200, 200);
      doc.text(subtitle, 20, 42);
    }
    
    // Date et heure de génération
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('fr-FR');
    
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 220);
    doc.text(`Généré le ${dateStr} à ${timeStr}`, pageWidth - 20, 25, { align: 'right' });
    
    return 55; // Retourne la position Y après l'en-tête
  }

  // Ajouter le pied de page
  addFooter(doc, pageNumber, totalPages) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Ligne de séparation
    doc.setDrawColor(...this.colors.muted);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
    
    // Informations de l'entreprise
    doc.setFontSize(8);
    doc.setTextColor(...this.colors.muted);
    doc.text(this.companyInfo.address, 20, pageHeight - 15);
    doc.text(`${this.companyInfo.phone} | ${this.companyInfo.email}`, 20, pageHeight - 10);
    
    // Numéro de page
    doc.text(`Page ${pageNumber} sur ${totalPages}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
    doc.text('Rapport confidentiel', pageWidth - 20, pageHeight - 10, { align: 'right' });
  }

  // Générer rapport de présences par événement (optimisé)
  async generateEventAttendanceReport(eventId) {
    // Vérifier les permissions avant de continuer
    this.checkExportPermissions();
    
    // Afficher le progrès
    this.showProgress('Initialisation...', 10);
    
    await this.waitForJsPDF();
    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();

    try {
      // Utiliser les données en cache pour de meilleures performances
      this.showProgress('Chargement des données...', 20);
      const data = this.getCachedData();
      const { events, members, attendances } = data;
      
      const event = events.find(e => e.id == eventId);
      if (!event) {
        throw new Error('Événement non trouvé');
      }

      this.showProgress('Traitement des présences...', 40);
      
      // Traitement optimisé des données
      const { processedMembers, stats } = this.processEventData(eventId, members, attendances);
      
      this.showProgress('Génération du PDF...', 60);
      
      // En-tête
      const subtitle = `Événement: ${event.name} - ${new Date(event.date).toLocaleDateString('fr-FR')}`;
      let yPos = this.addHeader(doc, 'RAPPORT DE PRÉSENCES', subtitle);

      // Statistiques générales (optimisées)
      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 STATISTIQUES GÉNÉRALES', 20, yPos);

      yPos += 15;

      
      // Cartes de statistiques (utilisant les stats pré-calculées)
      const statsData = [
        { label: 'Total Membres', value: stats.total, color: this.colors.muted },
        { label: 'Présents', value: stats.present, color: [34, 197, 94] },
        { label: 'Absents', value: stats.absent, color: [239, 68, 68] },
        { label: 'Excusés', value: stats.excused, color: [249, 115, 22] }
      ];

      statsData.forEach((stat, index) => {
        const x = 20 + (index * 45);
        
        // Fond de la carte
        doc.setFillColor(...stat.color);
        doc.roundedRect(x, yPos, 40, 25, 3, 3, 'F');
        
        // Texte
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value.toString(), x + 20, yPos + 12, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, x + 20, yPos + 20, { align: 'center' });
      });

      // Taux de présence (utilisant les stats pré-calculées)
      yPos += 35;
      doc.setFontSize(12);
      doc.setTextColor(...this.colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.text(`Taux de présence: ${stats.rate}%`, 20, yPos);

      // Barre de progression (utilisant les stats pré-calculées)
      yPos += 5;
      const barWidth = 170;
      const fillWidth = (barWidth * stats.rate) / 100;
      
      // Fond de la barre
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(20, yPos, barWidth, 8, 4, 4, 'F');
      
      // Remplissage
      if (fillWidth > 0) {
        const color = stats.rate >= 80 ? [34, 197, 94] : 
                     stats.rate >= 60 ? [249, 115, 22] : [239, 68, 68];
        doc.setFillColor(...color);
        doc.roundedRect(20, yPos, fillWidth, 8, 4, 4, 'F');
      }

      // Tableau détaillé des présences
      yPos += 25;
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.text('📋 DÉTAIL DES PRÉSENCES', 20, yPos);

      yPos += 10;

      this.showProgress('Génération du tableau...', 80);
      
      // Préparer les données du tableau (optimisé avec les données pré-traitées)
      const tableData = processedMembers.map(member => [
        member.name,
        member.dept || 'N/A',
        member.statusLabel,
        member.status !== 'N/A' ? new Date().toLocaleTimeString('fr-FR') : '-'
      ]);

      // Configuration du tableau
      doc.autoTable({
        startY: yPos,
        head: [['Nom du Membre', 'Département', 'Statut', 'Heure d\'enregistrement']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 5,
          font: 'helvetica'
        },
        headStyles: {
          fillColor: this.colors.primary,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.column.index === 2 && data.section === 'body') {
            const status = data.cell.text[0];
            if (status === 'Présent') {
              data.cell.styles.fillColor = [34, 197, 94, 0.1];
              data.cell.styles.textColor = [34, 197, 94];
            } else if (status === 'Absent') {
              data.cell.styles.fillColor = [239, 68, 68, 0.1];
              data.cell.styles.textColor = [239, 68, 68];
            } else if (status === 'Excusé') {
              data.cell.styles.fillColor = [249, 115, 22, 0.1];
              data.cell.styles.textColor = [249, 115, 22];
            }
          }
        }
      });

      this.showProgress('Finalisation...', 95);
      
      // Pied de page
      this.addFooter(doc, 1, 1);

      this.showProgress('Téléchargement...', 100);
      
      // Télécharger le PDF
      const fileName = `Rapport_Presences_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      try {
        doc.save(fileName);
        console.log(`PDF complet téléchargé: ${fileName}`);
      } catch (saveError) {
        console.error('Erreur lors du téléchargement:', saveError);
        throw new Error(`Impossible de télécharger le PDF: ${saveError.message}`);
      }

      // Masquer le progrès
      setTimeout(() => this.hideProgress(), 500);

      return { success: true, fileName, downloaded: true };

    } catch (error) {
      console.error('Erreur génération PDF:', error);
      return { success: false, error: error.message };
    }
  }

  // Générer rapport global de présences (optimisé)
  async generateGlobalAttendanceReport(startDate, endDate) {
    // Vérifier les permissions avant de continuer
    this.checkExportPermissions();
    
    this.showProgress('Initialisation du rapport global...', 10);
    
    await this.waitForJsPDF();
    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();

    try {
      this.showProgress('Chargement des données...', 20);
      const data = this.getCachedData();
      const { events, members, attendances, departments } = data;

      // Filtrer les événements par période
      const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
      });

      // En-tête
      const subtitle = `Période: ${new Date(startDate).toLocaleDateString('fr-FR')} - ${new Date(endDate).toLocaleDateString('fr-FR')}`;
      let yPos = this.addHeader(doc, 'RAPPORT GLOBAL DE PRÉSENCES', subtitle);

      // Statistiques par département
      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 STATISTIQUES PAR DÉPARTEMENT', 20, yPos);

      yPos += 15;

      const deptStats = [];
      departments.forEach(dept => {
        const deptMembers = members.filter(m => m.dept === dept);
        const deptAttendances = attendances.filter(a => {
          const member = members.find(m => m.id == a.memberId);
          return member && member.dept === dept;
        });
        
        const totalEvents = filteredEvents.length;
        const possibleAttendances = deptMembers.length * totalEvents;
        const actualAttendances = deptAttendances.filter(a => a.status === 'P').length;
        const attendanceRate = possibleAttendances > 0 ? ((actualAttendances / possibleAttendances) * 100).toFixed(1) : 0;

        deptStats.push([
          dept,
          deptMembers.length.toString(),
          totalEvents.toString(),
          actualAttendances.toString(),
          `${attendanceRate}%`
        ]);
      });

      // Tableau des statistiques par département
      doc.autoTable({
        startY: yPos,
        head: [['Département', 'Membres', 'Événements', 'Présences', 'Taux']],
        body: deptStats,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        headStyles: {
          fillColor: this.colors.secondary,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          4: { halign: 'center' }
        }
      });

      // Nouvelle page pour le détail par événement
      doc.addPage();
      yPos = this.addHeader(doc, 'DÉTAIL PAR ÉVÉNEMENT', subtitle);

      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.text('📅 PRÉSENCES PAR ÉVÉNEMENT', 20, yPos);

      yPos += 15;

      const eventStats = [];
      filteredEvents.forEach(event => {
        const eventAttendances = attendances.filter(a => a.eventId == event.id);
        const presentCount = eventAttendances.filter(a => a.status === 'P').length;
        const totalMembers = members.length;
        const attendanceRate = totalMembers > 0 ? ((presentCount / totalMembers) * 100).toFixed(1) : 0;

        eventStats.push([
          event.name,
          new Date(event.date).toLocaleDateString('fr-FR'),
          totalMembers.toString(),
          presentCount.toString(),
          `${attendanceRate}%`
        ]);
      });

      doc.autoTable({
        startY: yPos,
        head: [['Événement', 'Date', 'Total Membres', 'Présents', 'Taux']],
        body: eventStats,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 5
        },
        headStyles: {
          fillColor: this.colors.accent,
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' }
        }
      });

      // Pieds de page
      this.addFooter(doc, 1, 2);
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 2; i <= pageCount; i++) {
        doc.setPage(i);
        this.addFooter(doc, i, pageCount);
      }

      // Télécharger
      const fileName = `Rapport_Global_Presences_${startDate}_${endDate}.pdf`;
      doc.save(fileName);

      return { success: true, fileName };

    } catch (error) {
      console.error('Erreur génération PDF global:', error);
      return { success: false, error: error.message };
    }
  }

  // Générer rapport individuel de membre
  async generateMemberReport(memberId) {
    // Vérifier les permissions avant de continuer
    this.checkExportPermissions();
    
    await this.waitForJsPDF();
    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();

    try {
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      const members = JSON.parse(localStorage.getItem('members') || '[]');
      const attendances = JSON.parse(localStorage.getItem('attendances') || '[]');

      const member = members.find(m => m.id == memberId);
      if (!member) {
        throw new Error('Membre non trouvé');
      }

      const memberAttendances = attendances.filter(a => a.memberId == memberId);

      // En-tête
      const subtitle = `Membre: ${member.name} - Département: ${member.dept || 'N/A'}`;
      let yPos = this.addHeader(doc, 'RAPPORT INDIVIDUEL DE PRÉSENCES', subtitle);

      // Statistiques personnelles
      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.text('👤 PROFIL DU MEMBRE', 20, yPos);

      yPos += 15;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nom complet: ${member.name}`, 20, yPos);
      yPos += 8;
      doc.text(`Département: ${member.dept || 'Non assigné'}`, 20, yPos);
      yPos += 8;
      doc.text(`Rôle: ${member.role || 'Membre'}`, 20, yPos);

      // Statistiques de présence
      yPos += 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 STATISTIQUES DE PRÉSENCE', 20, yPos);

      const totalEvents = events.length;
      const presentCount = memberAttendances.filter(a => a.status === 'P').length;
      const absentCount = memberAttendances.filter(a => a.status === 'A').length;
      const excusedCount = memberAttendances.filter(a => a.status === 'AJ').length;
      const attendanceRate = totalEvents > 0 ? ((presentCount / totalEvents) * 100).toFixed(1) : 0;

      yPos += 15;
      
      // Graphique en barres simple
      const barHeight = 15;
      const barWidth = 150;
      
      // Présent
      doc.setFillColor(34, 197, 94);
      doc.rect(20, yPos, (presentCount / totalEvents) * barWidth, barHeight, 'F');
      doc.setTextColor(...this.colors.dark);
      doc.setFontSize(10);
      doc.text(`Présent: ${presentCount} (${((presentCount/totalEvents)*100).toFixed(1)}%)`, 20 + barWidth + 10, yPos + 10);

      yPos += 20;
      
      // Absent
      doc.setFillColor(239, 68, 68);
      doc.rect(20, yPos, (absentCount / totalEvents) * barWidth, barHeight, 'F');
      doc.text(`Absent: ${absentCount} (${((absentCount/totalEvents)*100).toFixed(1)}%)`, 20 + barWidth + 10, yPos + 10);

      yPos += 20;
      
      // Excusé
      doc.setFillColor(249, 115, 22);
      doc.rect(20, yPos, (excusedCount / totalEvents) * barWidth, barHeight, 'F');
      doc.text(`Excusé: ${excusedCount} (${((excusedCount/totalEvents)*100).toFixed(1)}%)`, 20 + barWidth + 10, yPos + 10);

      // Historique détaillé
      yPos += 35;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('📋 HISTORIQUE DÉTAILLÉ', 20, yPos);

      yPos += 10;

      // Tableau de l'historique
      const historyData = [];
      events.forEach(event => {
        const attendance = memberAttendances.find(a => a.eventId == event.id);
        const status = attendance ? attendance.status : 'N/A';
        const statusLabel = {
          'P': 'Présent',
          'A': 'Absent',
          'AJ': 'Excusé',
          'N/A': 'Non enregistré'
        }[status];

        historyData.push([
          event.name,
          new Date(event.date).toLocaleDateString('fr-FR'),
          statusLabel,
          attendance ? new Date(attendance.recordedAt || Date.now()).toLocaleTimeString('fr-FR') : '-'
        ]);
      });

      doc.autoTable({
        startY: yPos,
        head: [['Événement', 'Date', 'Statut', 'Heure']],
        body: historyData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: {
          fillColor: this.colors.primary,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        didParseCell: (data) => {
          if (data.column.index === 2 && data.section === 'body') {
            const status = data.cell.text[0];
            if (status === 'Présent') {
              data.cell.styles.fillColor = [34, 197, 94, 0.1];
              data.cell.styles.textColor = [34, 197, 94];
            } else if (status === 'Absent') {
              data.cell.styles.fillColor = [239, 68, 68, 0.1];
              data.cell.styles.textColor = [239, 68, 68];
            } else if (status === 'Excusé') {
              data.cell.styles.fillColor = [249, 115, 22, 0.1];
              data.cell.styles.textColor = [249, 115, 22];
            }
          }
        }
      });

      // Pied de page
      this.addFooter(doc, 1, 1);

      // Télécharger
      const fileName = `Rapport_Individuel_${member.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      return { success: true, fileName };

    } catch (error) {
      console.error('Erreur génération PDF individuel:', error);
      return { success: false, error: error.message };
    }
  }
}

// Instance globale
window.pdfReports = new PDFReportGenerator();

// Fonction utilitaire pour vérifier les permissions d'export
window.checkPDFExportPermissions = function() {
  const currentRole = localStorage.getItem('appRole');
  const authorizedRoles = ['admin', 'secretariat'];
  
  if (!authorizedRoles.includes(currentRole)) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Accès refusé. Seuls l\'Administrateur et le Secrétariat peuvent exporter des rapports PDF.', { duration: 5000 });
    } else {
      alert('Accès refusé. Seuls l\'Administrateur et le Secrétariat peuvent exporter des rapports PDF.');
    }
    
    // Rediriger vers la page d'accès refusé
    window.location.href = 'access-denied-reports.html';
    return false;
  }
  
  return true;
};

// Fonctions utilitaires pour l'interface
window.exportEventAttendance = async function(eventId) {
  // Vérifier les permissions avant de continuer
  if (!window.checkPDFExportPermissions()) {
    return { success: false, error: 'Permissions insuffisantes' };
  }
  
  if (window.notificationSystem) {
    window.notificationSystem.info('Génération du rapport PDF en cours...', { duration: 2000 });
  }
  
  try {
    const result = await window.pdfReports.generateEventAttendanceReport(eventId);
    
    if (result.success) {
      if (window.notificationSystem) {
        window.notificationSystem.success(`Rapport généré: ${result.fileName}`, { duration: 5000 });
      }
    } else {
      if (window.notificationSystem) {
        window.notificationSystem.error(`Erreur: ${result.error}`, { duration: 5000 });
      }
    }
    
    return result;
  } catch (error) {
    if (window.notificationSystem) {
      window.notificationSystem.error(`Erreur: ${error.message}`, { duration: 5000 });
    }
    return { success: false, error: error.message };
  }
};

window.exportGlobalAttendance = async function(startDate, endDate) {
  // Vérifier les permissions avant de continuer
  if (!window.checkPDFExportPermissions()) {
    return { success: false, error: 'Permissions insuffisantes' };
  }
  
  if (window.notificationSystem) {
    window.notificationSystem.info('Génération du rapport global en cours...', { duration: 2000 });
  }
  
  try {
    const result = await window.pdfReports.generateGlobalAttendanceReport(startDate, endDate);
    
    if (result.success) {
      if (window.notificationSystem) {
        window.notificationSystem.success(`Rapport global généré: ${result.fileName}`, { duration: 5000 });
      }
    } else {
      if (window.notificationSystem) {
        window.notificationSystem.error(`Erreur: ${result.error}`, { duration: 5000 });
      }
    }
    
    return result;
  } catch (error) {
    if (window.notificationSystem) {
      window.notificationSystem.error(`Erreur: ${error.message}`, { duration: 5000 });
    }
    return { success: false, error: error.message };
  }
};

window.exportMemberReport = async function(memberId) {
  // Vérifier les permissions avant de continuer
  if (!window.checkPDFExportPermissions()) {
    return { success: false, error: 'Permissions insuffisantes' };
  }
  
  if (window.notificationSystem) {
    window.notificationSystem.info('Génération du rapport individuel en cours...', { duration: 2000 });
  }
  
  try {
    const result = await window.pdfReports.generateMemberReport(memberId);
    
    if (result.success) {
      if (window.notificationSystem) {
        window.notificationSystem.success(`Rapport individuel généré: ${result.fileName}`, { duration: 5000 });
      }
    } else {
      if (window.notificationSystem) {
        window.notificationSystem.error(`Erreur: ${result.error}`, { duration: 5000 });
      }
    }
    
    return result;
  } catch (error) {
    if (window.notificationSystem) {
      window.notificationSystem.error(`Erreur: ${error.message}`, { duration: 5000 });
    }
    return { success: false, error: error.message };
  }
};
