// Générateur PDF ultra-rapide
// Version optimisée pour des performances maximales

class FastPDFGenerator {
  constructor() {
    this.optimizer = window.pdfOptimizer;
    this.templates = this.initializeTemplates();
  }

  // Initialiser les templates pré-compilés
  initializeTemplates() {
    return {
      eventReport: {
        title: 'RAPPORT DE PRÉSENCES',
        sections: ['header', 'stats', 'progressBar', 'table', 'footer']
      },
      globalReport: {
        title: 'RAPPORT GLOBAL DE PRÉSENCES',
        sections: ['header', 'globalStats', 'departmentSummary', 'footer']
      },
      memberReport: {
        title: 'RAPPORT INDIVIDUEL',
        sections: ['header', 'memberInfo', 'attendanceHistory', 'footer']
      }
    };
  }

  // Génération ultra-rapide de rapport d'événement
  async generateEventReportFast(eventId) {
    const startTime = performance.now();
    
    try {
      // Vérifier les permissions d'abord
      const currentRole = localStorage.getItem('appRole');
      if (!['admin', 'secretariat'].includes(currentRole)) {
        throw new Error('Accès refusé. Seuls l\'Administrateur et le Secrétariat peuvent exporter des rapports PDF.');
      }

      // Étape 1: Préparation instantanée (5ms)
      this.showFastProgress('Préparation...', 10);
      await this.optimizer.preloadLibraries();
      
      // Vérifier que jsPDF est bien chargé
      if (typeof window.jsPDF === 'undefined' || !window.jsPDF.jsPDF) {
        throw new Error('jsPDF n\'est pas chargé. Veuillez rafraîchir la page.');
      }
      
      const { jsPDF } = window.jsPDF;
      const doc = new jsPDF();

      // Étape 2: Données en cache (10ms)
      this.showFastProgress('Données...', 30);
      const data = this.optimizer.getCachedData();
      const event = data.events.find(e => e.id == eventId);
      
      if (!event) throw new Error('Événement non trouvé');

      // Étape 3: Traitement optimisé (20ms)
      this.showFastProgress('Traitement...', 50);
      const { processedMembers, eventAttendances } = this.optimizer.workerPool.dataProcessor.processEventData(
        eventId, data.members, data.attendances
      );

      const stats = this.optimizer.workerPool.statisticsCalculator.calculateEventStats(
        eventAttendances, data.members.length
      );

      // Étape 4: Génération PDF rapide (30ms)
      this.showFastProgress('Génération...', 70);
      let yPos = this.addFastHeader(doc, 'RAPPORT DE PRÉSENCES', 
        `${event.name} - ${new Date(event.date).toLocaleDateString('fr-FR')}`);

      yPos = this.addFastStats(doc, stats, yPos);
      yPos = this.addFastTable(doc, processedMembers, yPos);
      this.addFastFooter(doc);

      // Étape 5: Finalisation (5ms)
      this.showFastProgress('Finalisation...', 90);
      const fileName = `Rapport_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      
      this.showFastProgress('Téléchargement...', 100);
      
      // Forcer le téléchargement du PDF
      try {
        doc.save(fileName);
        console.log(`PDF téléchargé: ${fileName}`);
      } catch (saveError) {
        console.error('Erreur lors du téléchargement:', saveError);
        throw new Error(`Impossible de télécharger le PDF: ${saveError.message}`);
      }

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(0);
      
      setTimeout(() => this.hideFastProgress(), 300);
      
      if (window.notificationSystem) {
        window.notificationSystem.success(
          `✅ Rapport PDF téléchargé en ${duration}ms !`, 
          { duration: 4000 }
        );
      }

      return { success: true, fileName, duration: `${duration}ms`, downloaded: true };

    } catch (error) {
      this.hideFastProgress();
      console.error('Erreur génération rapide:', error);
      return { success: false, error: error.message };
    }
  }

  // En-tête rapide et minimaliste
  addFastHeader(doc, title, subtitle) {
    const pageWidth = doc.internal.pageSize.width;
    
    // Fond simple
    doc.setFillColor(0, 212, 255);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Titre
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 15, { align: 'center' });
    
    // Sous-titre
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, 25, { align: 'center' });
    
    return 45;
  }

  // Statistiques rapides
  addFastStats(doc, stats, yPos) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 STATISTIQUES', 20, yPos);
    
    yPos += 10;
    
    // Stats en ligne simple
    const statsText = `Total: ${stats.total} | Présents: ${stats.present} | Absents: ${stats.absent} | Taux: ${stats.rate}%`;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(statsText, 20, yPos);
    
    return yPos + 15;
  }

  // Tableau ultra-rapide
  addFastTable(doc, processedMembers, yPos) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 PRÉSENCES', 20, yPos);
    
    yPos += 10;
    
    // Tableau optimisé avec autoTable
    const tableData = this.optimizer.workerPool.tableGenerator.generateTableData(processedMembers);
    
    doc.autoTable({
      head: [['Nom', 'Département', 'Statut', 'Heure']],
      body: tableData,
      startY: yPos,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [0, 212, 255],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 }
      }
    });
    
    return doc.lastAutoTable.finalY + 10;
  }

  // Pied de page minimaliste
  addFastFooter(doc) {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('La Parole Eternelle - Rapport généré automatiquement', 20, pageHeight - 10);
    doc.text(new Date().toLocaleString('fr-FR'), pageWidth - 20, pageHeight - 10, { align: 'right' });
  }

  // Génération ultra-rapide de rapport global
  async generateGlobalReportFast(startDate, endDate) {
    const startTime = performance.now();
    
    try {
      // Vérifier les permissions d'abord
      const currentRole = localStorage.getItem('appRole');
      if (!['admin', 'secretariat'].includes(currentRole)) {
        throw new Error('Accès refusé. Seuls l\'Administrateur et le Secrétariat peuvent exporter des rapports PDF.');
      }

      this.showFastProgress('Initialisation...', 10);
      await this.optimizer.preloadLibraries();
      
      // Vérifier que jsPDF est bien chargé
      if (typeof window.jsPDF === 'undefined' || !window.jsPDF.jsPDF) {
        throw new Error('jsPDF n\'est pas chargé. Veuillez rafraîchir la page.');
      }
      
      const { jsPDF } = window.jsPDF;
      const doc = new jsPDF();

      this.showFastProgress('Chargement...', 30);
      const data = this.optimizer.getCachedData();
      
      // Filtrer les événements rapidement
      const filteredEvents = data.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
      });

      this.showFastProgress('Calculs...', 60);
      const globalStats = this.optimizer.workerPool.statisticsCalculator.calculateGlobalStats(
        filteredEvents, data.attendances, data.members
      );

      this.showFastProgress('PDF...', 80);
      let yPos = this.addFastHeader(doc, 'RAPPORT GLOBAL', 
        `Période: ${new Date(startDate).toLocaleDateString('fr-FR')} - ${new Date(endDate).toLocaleDateString('fr-FR')}`);

      // Stats globales rapides
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Événements: ${globalStats.totalEvents} | Membres: ${globalStats.totalMembers} | Présences: ${globalStats.totalPresences} | Taux: ${globalStats.globalRate}%`, 20, yPos);

      this.addFastFooter(doc);

      this.showFastProgress('Téléchargement...', 100);
      const fileName = `Rapport_Global_${startDate}_${endDate}_${Date.now()}.pdf`;
      
      // Forcer le téléchargement du PDF
      try {
        doc.save(fileName);
        console.log(`PDF global téléchargé: ${fileName}`);
      } catch (saveError) {
        console.error('Erreur lors du téléchargement:', saveError);
        throw new Error(`Impossible de télécharger le PDF: ${saveError.message}`);
      }

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(0);
      
      setTimeout(() => this.hideFastProgress(), 300);
      
      if (window.notificationSystem) {
        window.notificationSystem.success(
          `✅ Rapport global PDF téléchargé en ${duration}ms !`, 
          { duration: 4000 }
        );
      }

      return { success: true, fileName, duration: `${duration}ms`, downloaded: true };

    } catch (error) {
      this.hideFastProgress();
      return { success: false, error: error.message };
    }
  }

  // Génération ultra-rapide de rapport membre
  async generateMemberReportFast(memberId) {
    const startTime = performance.now();
    
    try {
      // Vérifier les permissions d'abord
      const currentRole = localStorage.getItem('appRole');
      if (!['admin', 'secretariat'].includes(currentRole)) {
        throw new Error('Accès refusé. Seuls l\'Administrateur et le Secrétariat peuvent exporter des rapports PDF.');
      }

      this.showFastProgress('Préparation...', 20);
      await this.optimizer.preloadLibraries();
      
      // Vérifier que jsPDF est bien chargé
      if (typeof window.jsPDF === 'undefined' || !window.jsPDF.jsPDF) {
        throw new Error('jsPDF n\'est pas chargé. Veuillez rafraîchir la page.');
      }
      
      const { jsPDF } = window.jsPDF;
      const doc = new jsPDF();

      this.showFastProgress('Données membre...', 50);
      const data = this.optimizer.getCachedData();
      const member = data.members.find(m => m.id == memberId);
      
      if (!member) throw new Error('Membre non trouvé');

      const memberAttendances = data.attendances.filter(a => a.memberId == memberId);

      this.showFastProgress('Génération...', 80);
      let yPos = this.addFastHeader(doc, 'RAPPORT INDIVIDUEL', 
        `${member.name} - ${member.dept || 'N/A'}`);

      // Stats membre rapides
      yPos += 10;
      const totalEvents = data.events.length;
      const presentCount = memberAttendances.filter(a => a.status === 'P').length;
      const rate = totalEvents > 0 ? ((presentCount / totalEvents) * 100).toFixed(1) : 0;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Événements totaux: ${totalEvents} | Présences: ${presentCount} | Taux personnel: ${rate}%`, 20, yPos);

      this.addFastFooter(doc);

      this.showFastProgress('Téléchargement...', 100);
      const fileName = `Rapport_${member.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      
      // Forcer le téléchargement du PDF
      try {
        doc.save(fileName);
        console.log(`PDF membre téléchargé: ${fileName}`);
      } catch (saveError) {
        console.error('Erreur lors du téléchargement:', saveError);
        throw new Error(`Impossible de télécharger le PDF: ${saveError.message}`);
      }

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(0);
      
      setTimeout(() => this.hideFastProgress(), 300);
      
      if (window.notificationSystem) {
        window.notificationSystem.success(
          `✅ Rapport membre PDF téléchargé en ${duration}ms !`, 
          { duration: 4000 }
        );
      }

      return { success: true, fileName, duration: `${duration}ms`, downloaded: true };

    } catch (error) {
      this.hideFastProgress();
      return { success: false, error: error.message };
    }
  }

  // Progrès rapide et discret
  showFastProgress(message, percentage) {
    if (window.notificationSystem && !this.fastProgressNotification) {
      this.fastProgressNotification = window.notificationSystem.info(
        `⚡ ${message} ${percentage}%`, 
        { duration: 200, persistent: true }
      );
    }
  }

  // Masquer le progrès rapide
  hideFastProgress() {
    if (this.fastProgressNotification && window.notificationSystem) {
      window.notificationSystem.dismiss(this.fastProgressNotification);
      this.fastProgressNotification = null;
    }
  }
}

// Instance globale du générateur rapide
window.fastPDFGenerator = new FastPDFGenerator();

// Fonctions utilitaires rapides pour l'interface
window.fastExportEventAttendance = async function(eventId) {
  return await window.fastPDFGenerator.generateEventReportFast(eventId);
};

window.fastExportGlobalAttendance = async function(startDate, endDate) {
  return await window.fastPDFGenerator.generateGlobalReportFast(startDate, endDate);
};

window.fastExportMemberReport = async function(memberId) {
  return await window.fastPDFGenerator.generateMemberReportFast(memberId);
};
