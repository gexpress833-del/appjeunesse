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

  // Fonction helper pour mapper les statuts Supabase vers les codes d'affichage
  mapStatusToCode(status) {
    const statusMap = {
      'present': 'P',
      'absent': 'A',
      'excused': 'AJ',
      'late': 'L'
    };
    return statusMap[status] || status;
  }

  // Cache pour les données fréquemment utilisées
  async getCachedData() {
    if (!this.dataCache || Date.now() - this.dataCacheTime > 30000) { // Cache 30s
      // Charger depuis Supabase uniquement
      if (!window.supabaseDB || !window.supabaseDB.getClient()) {
        console.error('❌ Supabase n\'est pas configuré');
        this.dataCache = { members: [], events: [], attendances: [], departments: [] };
        this.dataCacheTime = Date.now();
        return this.dataCache;
      }
      
      try {
        const [members, events, attendances, departments] = await Promise.all([
          window.supabaseDB.getMembers(),
          window.supabaseDB.getEvents(),
          window.supabaseDB.getAttendances(),
          window.supabaseDB.getDepartments()
        ]);
        
        // Mapper les présences depuis Supabase vers un format cohérent avec le reste de l'app
        const mappedAttendances = (attendances || []).map(att => ({
          id: att.id,
          memberId: att.member_id,
          eventId: att.event_id,
          status: this.mapStatusToCode(att.status),
          notes: att.notes,
          createdAt: att.created_at,
          updatedAt: att.updated_at
        }));
        
        this.dataCache = {
          // Les membres et événements sont déjà dans un format exploitable (id, name, dept, date, ...)
          members: members || [],
          events: events || [],
          attendances: mappedAttendances,
          departments: departments || []
        };
        this.dataCacheTime = Date.now();
      } catch (error) {
        console.error('Erreur lors du chargement des données depuis Supabase:', error);
        this.dataCache = { members: [], events: [], attendances: [], departments: [] };
        this.dataCacheTime = Date.now();
      }
    }
    return this.dataCache;
  }

  // Afficher le progrès de génération
  showProgress(message, percentage) {
    // Mettre à jour l'overlay de chargement s'il existe
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay && loadingOverlay.style.display !== 'none') {
      const progressText = loadingOverlay.querySelector('p');
      if (progressText) {
        progressText.textContent = `${message} (${percentage}%)`;
      }
    }
    
    // Utiliser le système de notifications uniquement pour les messages importants
    if (window.notificationSystem && percentage >= 100) {
      // Ne pas afficher de notification pour chaque étape, seulement à la fin
      // Les notifications de progression sont gérées par l'overlay de chargement
    }
  }

  // Masquer le progrès
  hideProgress() {
    // Fermer l'overlay de chargement s'il existe
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
    
    // Nettoyer les notifications de progression si nécessaire
    if (this.currentProgressNotification && window.notificationSystem) {
      // Le système de notifications gère automatiquement la fermeture via duration
      this.currentProgressNotification = null;
    }
  }

  // Traitement optimisé des données d'événement
  processEventData(eventId, members, attendances) {
    // IDs normalisés (tous en nombre)
    const normalizedEventId = typeof eventId === 'string' ? parseInt(eventId) : eventId;
    
    const eventAttendances = attendances.filter(a => {
      const attEventId = typeof a.eventId === 'string' ? parseInt(a.eventId) : a.eventId;
      return attEventId === normalizedEventId;
    });
    
    // Créer un map pour un accès rapide aux présences
    const attendanceMap = new Map();
    eventAttendances.forEach(att => {
      const attMemberId = typeof att.memberId === 'string' ? parseInt(att.memberId) : att.memberId;
      attendanceMap.set(attMemberId, att.status);
    });
    
    // Traiter les membres avec leurs présences
    const processedMembers = members.map(member => {
      const memberId = typeof member.id === 'string' ? parseInt(member.id) : member.id;
      const status = attendanceMap.get(memberId) || 'N/A';
      return {
        ...member,
        id: memberId,
        status: status,
        statusLabel: this.getStatusLabel(status)
      };
    });
    
    // Calculer les statistiques
    const stats = {
      total: members.length,
      present: 0,
      absent: 0,
      excused: 0,
      notRecorded: 0
    };
    
    // Compter les présences enregistrées (par statut)
    eventAttendances.forEach(att => {
      switch(att.status) {
        case 'P': stats.present++; break;
        case 'A': stats.absent++; break;
        case 'AJ': stats.excused++; break;
      }
    });
    
    // Compter les membres sans présence enregistrée
    processedMembers.forEach(member => {
      if (member.status === 'N/A') {
        stats.notRecorded++;
      }
    });
    
    // Taux de présence basé sur les membres présents / total membres
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

  // Ajouter l'en-tête professionnel avec logo
  async addHeader(doc, title, subtitle = '', eventInfo = null) {
    const pageWidth = doc.internal.pageSize.width;
    const headerHeight = 70;
    
    // Fond avec couleur unie (plus lisible)
    doc.setFillColor(0, 150, 200); // Bleu plus foncé pour meilleur contraste
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Ajouter le logo si disponible (sans canvas pour éviter les problèmes CORS/tainted)
    // IMPORTANT : si l'application est ouverte en file:// (développement local),
    // on évite complètement de charger l'image pour ne pas provoquer d'erreurs CORS.
    let logoLoaded = false;
    const isFileProtocol = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';

    if (!isFileProtocol) {
      try {
        const logoImg = new Image();
        // Chemin RELATIF simple – le même que celui utilisé dans les pages HTML
        logoImg.src = 'images/logo.jpg';

        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('Timeout lors du chargement du logo (pdf-reports)');
            resolve();
          }, 2000);

          logoImg.onload = () => {
            clearTimeout(timeout);
            try {
              const logoSize = 35;
              // jsPDF accepte directement un élément <img> comme source
              doc.addImage(logoImg, 'JPEG', 15, 15, logoSize, logoSize);
              logoLoaded = true;
            } catch (e) {
              console.warn('Erreur lors de l\'ajout du logo dans le PDF:', e);
            }
            resolve();
          };

          logoImg.onerror = () => {
            clearTimeout(timeout);
            console.warn('Logo non trouvé à l\'emplacement "images/logo.jpg" (pdf-reports)');
            resolve();
          };
        });
      } catch (e) {
        console.warn('Erreur inattendue lors du chargement du logo pour le PDF:', e);
      }
    }
    
    // Zone de texte (à droite du logo ou depuis le début)
    const logoX = 15;
    const logoWidth = logoLoaded ? 35 : 0;
    const textX = logoX + logoWidth + (logoLoaded ? 12 : 0);
    const rightMargin = 15;
    
    // Nom de l'église (grand et visible)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, textX, 28);
    
    // Informations de contact (petites mais lisibles)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(240, 240, 240);
    doc.text(this.companyInfo.address, textX, 35);
    doc.text(`${this.companyInfo.phone} | ${this.companyInfo.email}`, textX, 41);
    
    // Ligne de séparation subtile
    doc.setDrawColor(255, 255, 255, 0.3);
    doc.setLineWidth(0.5);
    doc.line(textX, 45, pageWidth - rightMargin, 45);
    
    // Titre du rapport (centré, bien visible)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const titleY = 55;
    doc.text(title, pageWidth / 2, titleY, { align: 'center' });
    
    // Sous-titre avec informations de l'événement (si fourni)
    if (eventInfo) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      const eventNameY = titleY + 8;
      const eventNameText = `${eventInfo.name} - ${new Date(eventInfo.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
      const eventNameLines = doc.splitTextToSize(eventNameText, pageWidth - 40);
      doc.text(eventNameLines[0], pageWidth / 2, eventNameY, { align: 'center', maxWidth: pageWidth - 40 });
      
      // Description de l'événement (si disponible)
      if (eventInfo.description && eventInfo.description.trim()) {
        doc.setFontSize(8);
        doc.setTextColor(240, 240, 240);
        const descY = eventNameY + 6;
        const maxWidth = pageWidth - 40;
        const descLines = doc.splitTextToSize(eventInfo.description.trim(), maxWidth);
        if (descLines.length > 0) {
          doc.text(descLines[0], pageWidth / 2, descY, { align: 'center', maxWidth: maxWidth });
        }
      }
    } else if (subtitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(subtitle, pageWidth / 2, titleY + 8, { align: 'center' });
    }
    
    // Date et heure de génération (coin supérieur droit, petit)
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    doc.setFontSize(7);
    doc.setTextColor(240, 240, 240);
    doc.text(`Généré: ${dateStr} ${timeStr}`, pageWidth - rightMargin, 22, { align: 'right' });
    
    return headerHeight + 15; // Retourne la position Y après l'en-tête
  }

  // Ajouter le pied de page
  addFooter(doc, pageNumber, totalPages) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
    
    // Informations de l'entreprise
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(this.companyInfo.address, 20, pageHeight - 20);
    doc.setFontSize(8);
    doc.text(`${this.companyInfo.phone} | ${this.companyInfo.email}`, 20, pageHeight - 12);
    
    // Numéro de page
    doc.setFontSize(9);
    doc.text(`Page ${pageNumber} sur ${totalPages}`, pageWidth - 20, pageHeight - 20, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Rapport confidentiel', pageWidth - 20, pageHeight - 12, { align: 'right' });
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
      const data = await this.getCachedData();
      const { events, members, attendances } = data;
      
      const event = events.find(e => e.id == eventId);
      if (!event) {
        throw new Error('Événement non trouvé');
      }

      this.showProgress('Traitement des présences...', 40);
      
      // Traitement optimisé des données
      const { processedMembers, stats } = this.processEventData(eventId, members, attendances);
      
      this.showProgress('Génération du PDF...', 60);
      
      // En-tête avec informations de l'événement
      let yPos = await this.addHeader(doc, 'RAPPORT DE PRÉSENCES', '', {
        name: event.name,
        date: event.date,
        description: event.description || ''
      });

      // Ligne de séparation
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, yPos - 5, doc.internal.pageSize.width - 20, yPos - 5);
      
      // Statistiques générales (optimisées)
      yPos += 15;
      doc.setFontSize(16);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'bold');
      doc.text('STATISTIQUES GÉNÉRALES', 20, yPos);

      yPos += 15;

      
      // Cartes de statistiques (utilisant les stats pré-calculées)
      // Afficher seulement les statistiques pertinentes (si pas de "Non enregistré", on peut afficher 4 cartes)
      const statsData = [
        { label: 'Total Membres', value: stats.total, color: [100, 100, 100] },
        { label: 'Présents', value: stats.present, color: [34, 197, 94] },
        { label: 'Absents', value: stats.absent, color: [239, 68, 68] },
        { label: 'Excusés', value: stats.excused, color: [249, 115, 22] }
      ];
      
      // On ne crée plus de cinquième carte pour "Non enregistrés" afin d'éviter qu'elle soit coupée.
      // L'information des membres non enregistrés est déjà affichée dans la note sous le taux de présence.

      // Ajuster la largeur des cartes selon le nombre, en s'assurant qu'elles tiennent toutes sur la ligne
      const cardHeight = 28;
      const cardSpacing = 5;
      const statsCount = statsData.length; // restera 4 cartes max
      const statsPageWidth = doc.internal.pageSize.width;
      const statsAvailableWidth = statsPageWidth - 40; // marges gauche/droite de 20 mm chacune

      // Pour 4 cartes ou moins, garder le style large d'origine.
      // Pour 5 cartes ou plus, calculer dynamiquement la largeur pour éviter que la dernière carte soit coupée.
      const cardWidth = statsCount > 4
        ? (statsAvailableWidth - cardSpacing * (statsCount - 1)) / statsCount
        : 42;

      const totalCardsWidth = (statsCount * cardWidth) + ((statsCount - 1) * cardSpacing);
      const startX = (statsPageWidth - totalCardsWidth) / 2;

      statsData.forEach((stat, index) => {
        const x = startX + (index * (cardWidth + cardSpacing));
        
        // Fond de la carte avec coins arrondis
        doc.setFillColor(...stat.color);
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 4, 4, 'F');
        
        // Bordure subtile
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 4, 4, 'S');
        
        // Valeur
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value.toString(), x + cardWidth / 2, yPos + 14, { align: 'center' });
        
        // Label
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, x + cardWidth / 2, yPos + 23, { align: 'center', maxWidth: cardWidth - 4 });
      });

      // Taux de présence (utilisant les stats pré-calculées)
      // On laisse un peu plus d'espace sous les cartes pour mieux respirer
      yPos += 42;
      doc.setFontSize(13);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'bold');
      
      // Afficher le taux de présence avec explication
      if (stats.total === 0) {
        doc.text('Taux de présence: 0% (aucun membre)', 20, yPos);
      } else if (stats.notRecorded > 0) {
        doc.text(`Taux de présence: ${stats.rate}% (${stats.present}/${stats.total} membres)`, 20, yPos);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        yPos += 6;
        doc.text(`Note: ${stats.notRecorded} membre(s) sans présence enregistrée`, 20, yPos);
        yPos -= 6;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
      } else {
        doc.text(`Taux de présence: ${stats.rate}% (${stats.present}/${stats.total} membres présents)`, 20, yPos);
      }

      // Barre de progression (utilisant les stats pré-calculées)
      // Alignée sous le texte, avec la même marge gauche (20), et un espace vertical plus confortable
      yPos += 8;
      const barX = 20;
      const barWidth = statsAvailableWidth; // s'étend jusqu'à la marge droite
      const fillWidth = (barWidth * stats.rate) / 100;
      
      // Fond de la barre
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(barX, yPos, barWidth, 8, 4, 4, 'F');
      
      // Remplissage
      if (fillWidth > 0) {
        const color = stats.rate >= 80 ? [34, 197, 94] : 
                     stats.rate >= 60 ? [249, 115, 22] : [239, 68, 68];
        doc.setFillColor(...color);
        doc.roundedRect(barX, yPos, fillWidth, 8, 4, 4, 'F');
      }

      // Ligne de séparation avec plus d'espace sous la barre
      yPos += 22;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, yPos, doc.internal.pageSize.width - 20, yPos);
      
      // Tableau détaillé des présences
      yPos += 20;
      doc.setFontSize(16);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'bold');
      doc.text('DÉTAIL DES PRÉSENCES', 20, yPos);

      yPos += 10;

      this.showProgress('Génération du tableau...', 80);
      
      // Préparer les données du tableau (optimisé avec les données pré-traitées)
      const normalizedEventId = typeof eventId === 'string' ? parseInt(eventId) : eventId;
      const tableData = processedMembers.map(member => {
        // Trouver l'heure d'enregistrement réelle depuis les présences
        const attendance = attendances.find(a => {
          const attEventId = typeof a.eventId === 'string' ? parseInt(a.eventId) : a.eventId;
          const attMemberId = typeof a.memberId === 'string' ? parseInt(a.memberId) : a.memberId;
          return attEventId == normalizedEventId && attMemberId == member.id;
        });
        
        const recordedTime = attendance && attendance.created_at 
          ? new Date(attendance.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : (member.status !== 'N/A' ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-');
        
        return [
          member.name || 'N/A',
          member.dept || 'N/A',
          member.statusLabel || 'Non enregistré',
          recordedTime
        ];
      });

      // Configuration du tableau
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const availableWidth = pageWidth - (margin * 2);
      
      doc.autoTable({
        startY: yPos + 8,
        head: [['Nom du Membre', 'Département', 'Statut', 'Heure']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 5,
          font: 'helvetica',
          textColor: [50, 50, 50],
          lineColor: [220, 220, 220],
          lineWidth: 0.5,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [0, 212, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: availableWidth * 0.35, halign: 'left' }, // Nom
          1: { cellWidth: availableWidth * 0.25, halign: 'left' }, // Département
          2: { cellWidth: availableWidth * 0.25, halign: 'center' }, // Statut
          3: { cellWidth: availableWidth * 0.15, halign: 'center', fontSize: 8 } // Heure
        },
        margin: { left: margin, right: margin },
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

      // Masquer le progrès immédiatement
      this.hideProgress();

      return { success: true, fileName, downloaded: true };

    } catch (error) {
      console.error('Erreur génération PDF:', error);
      // Masquer le progrès en cas d'erreur
      this.hideProgress();
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
      const data = await this.getCachedData();
      const { events, members, attendances, departments } = data;

      // Filtrer les événements par période
      const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
      });

      // En-tête
      const subtitle = `Période: ${new Date(startDate).toLocaleDateString('fr-FR')} - ${new Date(endDate).toLocaleDateString('fr-FR')}`;
      let yPos = await this.addHeader(doc, 'RAPPORT GLOBAL DE PRÉSENCES', subtitle);

      // Statistiques par département
      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 STATISTIQUES PAR DÉPARTEMENT', 20, yPos);

      yPos += 15;

      const deptStats = [];
      // S'assurer que departments est un tableau de noms (chaînes)
      const deptNames = departments.map(d => typeof d === 'string' ? d : d.name);
      
      deptNames.forEach(deptName => {
        const deptMembers = members.filter(m => m.dept === deptName);
        const deptAttendances = attendances.filter(a => {
          const member = members.find(m => m.id == a.memberId);
          return member && member.dept === deptName;
        });
        
        const totalEvents = filteredEvents.length;
        const possibleAttendances = deptMembers.length * totalEvents;
        const actualAttendances = deptAttendances.filter(a => a.status === 'P').length;
        const attendanceRate = possibleAttendances > 0 ? ((actualAttendances / possibleAttendances) * 100).toFixed(1) : 0;

        deptStats.push([
          deptName,
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

      // Masquer le progrès
      this.hideProgress();

      return { success: true, fileName };

    } catch (error) {
      console.error('Erreur génération PDF global:', error);
      // Masquer le progrès en cas d'erreur
      this.hideProgress();
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
      // Charger depuis Supabase uniquement
      if (!window.supabaseDB || !window.supabaseDB.getClient()) {
        console.error('❌ Supabase n\'est pas configuré');
        return;
      }
      
      const [events, members, attendances] = await Promise.all([
        window.supabaseDB.getEvents(),
        window.supabaseDB.getMembers(),
        window.supabaseDB.getAttendances()
      ]);

      const member = members.find(m => m.id == memberId);
      if (!member) {
        throw new Error('Membre non trouvé');
      }

      // Mapper les statuts depuis Supabase vers les codes d'affichage
      const mappedAttendances = attendances.map(att => ({
        ...att,
        status: this.mapStatusToCode(att.status)
      }));

      const memberAttendances = mappedAttendances.filter(a => a.memberId == memberId);

      // En-tête
      const subtitle = `Membre: ${member.name} - Département: ${member.dept || 'N/A'}`;
      let yPos = await this.addHeader(doc, 'RAPPORT INDIVIDUEL DE PRÉSENCES', subtitle);

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

      // Masquer le progrès
      this.hideProgress();

      return { success: true, fileName };

    } catch (error) {
      console.error('Erreur génération PDF individuel:', error);
      // Masquer le progrès en cas d'erreur
      this.hideProgress();
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

// Fonctions d'export rapide (sans overlay de chargement)
window.fastExportEventAttendance = async function(eventId) {
  if (!window.checkPDFExportPermissions()) {
    return { success: false, error: 'Permissions insuffisantes' };
  }
  
  try {
    const result = await window.pdfReports.generateEventAttendanceReport(eventId);
    
    if (result.success) {
      if (window.notificationSystem) {
        window.notificationSystem.success(`Rapport généré: ${result.fileName}`, { duration: 3000 });
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

window.fastExportGlobalAttendance = async function(startDate, endDate) {
  if (!window.checkPDFExportPermissions()) {
    return { success: false, error: 'Permissions insuffisantes' };
  }
  
  try {
    const result = await window.pdfReports.generateGlobalAttendanceReport(startDate, endDate);
    
    if (result.success) {
      if (window.notificationSystem) {
        window.notificationSystem.success(`Rapport global généré: ${result.fileName}`, { duration: 3000 });
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

window.fastExportMemberReport = async function(memberId) {
  if (!window.checkPDFExportPermissions()) {
    return { success: false, error: 'Permissions insuffisantes' };
  }
  
  try {
    const result = await window.pdfReports.generateMemberReport(memberId);
    
    if (result.success) {
      if (window.notificationSystem) {
        window.notificationSystem.success(`Rapport individuel généré: ${result.fileName}`, { duration: 3000 });
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
