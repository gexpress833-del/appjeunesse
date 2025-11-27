// Optimiseur de performance pour la génération PDF
// Améliore significativement la vitesse de génération des rapports

class PDFPerformanceOptimizer {
  constructor() {
    this.preloadLibraries();
    this.initializeWorkerPool();
  }

  // Précharger les bibliothèques PDF
  async preloadLibraries() {
    if (typeof window.jsPDF === 'undefined') {
      const promises = [
        this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
        this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js')
      ];
      
      await Promise.all(promises);
    }
  }

  // Charger un script de manière asynchrone
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialiser un pool de workers (simulation)
  initializeWorkerPool() {
    this.workerPool = {
      dataProcessor: this.createDataProcessor(),
      tableGenerator: this.createTableGenerator(),
      statisticsCalculator: this.createStatisticsCalculator()
    };
  }

  // Processeur de données optimisé
  createDataProcessor() {
    return {
      processEventData: (eventId, members, attendances) => {
        // Utiliser Map pour des lookups O(1)
        const attendanceMap = new Map();
        const eventAttendances = [];
        
        // Une seule boucle pour filtrer et mapper
        for (const att of attendances) {
          if (att.eventId == eventId) {
            eventAttendances.push(att);
            attendanceMap.set(att.memberId, att);
          }
        }
        
        // Traitement optimisé des membres
        const processedMembers = members.map(member => {
          const attendance = attendanceMap.get(member.id);
          return {
            ...member,
            status: attendance ? attendance.status : 'N/A',
            statusLabel: this.getStatusLabel(attendance ? attendance.status : 'N/A'),
            attendance: attendance
          };
        });
        
        return { processedMembers, eventAttendances };
      }
    };
  }

  // Générateur de tableaux optimisé
  createTableGenerator() {
    return {
      generateTableData: (processedMembers) => {
        // Génération optimisée en une seule passe
        return processedMembers.map(member => [
          member.name || 'N/A',
          member.dept || 'N/A',
          member.statusLabel,
          member.attendance ? new Date().toLocaleTimeString('fr-FR') : '-'
        ]);
      },
      
      generateDepartmentSummary: (processedMembers, departments) => {
        const deptStats = new Map();
        
        // Initialiser les départements
        departments.forEach(dept => {
          deptStats.set(dept, { total: 0, present: 0, absent: 0, excused: 0 });
        });
        
        // Calculer les statistiques par département
        processedMembers.forEach(member => {
          const dept = member.dept || 'Non défini';
          if (!deptStats.has(dept)) {
            deptStats.set(dept, { total: 0, present: 0, absent: 0, excused: 0 });
          }
          
          const stats = deptStats.get(dept);
          stats.total++;
          
          switch(member.status) {
            case 'P': stats.present++; break;
            case 'A': stats.absent++; break;
            case 'AJ': stats.excused++; break;
          }
        });
        
        return Array.from(deptStats.entries()).map(([dept, stats]) => [
          dept,
          stats.total.toString(),
          stats.present.toString(),
          stats.absent.toString(),
          stats.excused.toString(),
          stats.total > 0 ? `${((stats.present / stats.total) * 100).toFixed(1)}%` : '0%'
        ]);
      }
    };
  }

  // Calculateur de statistiques optimisé
  createStatisticsCalculator() {
    return {
      calculateEventStats: (eventAttendances, totalMembers) => {
        const stats = { total: totalMembers, present: 0, absent: 0, excused: 0 };
        
        // Une seule boucle pour tous les calculs
        eventAttendances.forEach(att => {
          switch(att.status) {
            case 'P': stats.present++; break;
            case 'A': stats.absent++; break;
            case 'AJ': stats.excused++; break;
          }
        });
        
        stats.rate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;
        return stats;
      },
      
      calculateGlobalStats: (events, attendances, members) => {
        const totalEvents = events.length;
        const totalMembers = members.length;
        let totalPresences = 0;
        
        // Compter les présences en une seule passe
        attendances.forEach(att => {
          if (att.status === 'P') totalPresences++;
        });
        
        const possibleAttendances = totalMembers * totalEvents;
        const globalRate = possibleAttendances > 0 ? 
          ((totalPresences / possibleAttendances) * 100).toFixed(1) : 0;
        
        return {
          totalEvents,
          totalMembers,
          totalPresences,
          globalRate,
          possibleAttendances
        };
      }
    };
  }

  // Obtenir le libellé du statut (méthode statique pour performance)
  getStatusLabel(status) {
    switch(status) {
      case 'P': return 'Présent';
      case 'A': return 'Absent';
      case 'AJ': return 'Absent Justifié';
      default: return 'Non enregistré';
    }
  }

  // Optimiser les styles PDF (réutilisation)
  getOptimizedStyles() {
    if (!this.cachedStyles) {
      this.cachedStyles = {
        headerStyle: {
          fillColor: [0, 212, 255],
          textColor: [255, 255, 255],
          fontSize: 12,
          fontStyle: 'bold'
        },
        cellStyle: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        alternateRowStyle: {
          fillColor: [248, 250, 252]
        }
      };
    }
    return this.cachedStyles;
  }

  // Batch processing pour de gros volumes de données
  processBatch(data, batchSize = 100, processor) {
    const results = [];
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      results.push(...processor(batch));
    }
    return results;
  }

  // Mise en cache intelligente des données (en mémoire uniquement)
  _dataCache = null;
  _dataCacheTime = null;
  _cacheTimeout = 60000; // 1 minute

  async getCachedData(forceRefresh = false) {
    // Vérifier le cache en mémoire
    if (!forceRefresh && this._dataCache && this._dataCacheTime) {
      if ((Date.now() - this._dataCacheTime) < this._cacheTimeout) {
        return this._dataCache;
      }
    }
    
    // Recharger les données depuis Supabase uniquement
    if (!window.supabaseDB || !window.supabaseDB.getClient()) {
      console.error('❌ Supabase n\'est pas configuré');
      return { members: [], events: [], attendances: [], departments: [] };
    }
    
    try {
      const [members, events, attendances, departments] = await Promise.all([
        window.supabaseDB.getMembers(),
        window.supabaseDB.getEvents(),
        window.supabaseDB.getAttendances(),
        window.supabaseDB.getDepartments()
      ]);
      
      const data = {
        members: members || [],
        events: events || [],
        attendances: attendances || [],
        departments: departments || []
      };
      
      // Mettre en cache en mémoire uniquement (pas localStorage)
      this._dataCache = data;
      this._dataCacheTime = Date.now();
    
      return data;
    } catch (error) {
      console.error('Erreur lors du chargement des données depuis Supabase:', error);
      return { members: [], events: [], attendances: [], departments: [] };
    }
  }

  // Nettoyage du cache
  clearCache() {
    this._dataCache = null;
    this._dataCacheTime = null;
  }

  // Optimisation de la mémoire
  optimizeMemory() {
    // Forcer le garbage collection (si disponible)
    if (window.gc) {
      window.gc();
    }
    
    // Nettoyer les caches internes
    this.cachedStyles = null;
    
    // Nettoyer les données temporaires
    if (this.tempData) {
      this.tempData = null;
    }
  }

  // Mesurer les performances
  measurePerformance(operation, operationName = 'Operation') {
    return async (...args) => {
      const startTime = performance.now();
      const result = await operation(...args);
      const endTime = performance.now();
      
      console.log(`${operationName} completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      return result;
    };
  }

  // Préchargement intelligent des données
  async preloadDataForReports() {
    return new Promise((resolve) => {
      // Précharger en arrière-plan
      setTimeout(() => {
        this.getCachedData(true);
        resolve();
      }, 0);
    });
  }
}

// Instance globale de l'optimiseur
window.pdfOptimizer = new PDFPerformanceOptimizer();

// Précharger automatiquement au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  window.pdfOptimizer.preloadDataForReports();
});

// Nettoyer le cache périodiquement
setInterval(() => {
  window.pdfOptimizer.optimizeMemory();
}, 5 * 60 * 1000); // Toutes les 5 minutes
