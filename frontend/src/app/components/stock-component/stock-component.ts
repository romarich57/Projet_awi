import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockService } from '@app/services/stock-service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-stock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule],
  templateUrl: './stock-component.html',
  styleUrls: ['./stock-component.scss']
})
export class StockDisplayComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef); 
  constructor() {
    console.log('🏗️ CONSTRUCTEUR StockComponent');
  }
  
  private route = inject(ActivatedRoute);
  private stockService = inject(StockService);
  private location = inject(Location);
  
  // AJOUTE CES PROPRIÉTÉS :
  festivalId: number = 0;
  stock: any = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    // Récupère l'ID de la route
    this.festivalId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('🔄 ngOnInit - Festival ID:', this.festivalId);
    
    // Force un cycle de détection
    setTimeout(() => {
      this.loadStock();
      this.cdr.detectChanges();
    });
  }

  goBack(): void {
    this.location.back();
  }

  ngAfterViewInit() {
  console.log('👁️ AFTER VIEW INIT');
  
  setTimeout(() => {
    console.log('⏰ Début loadStock');
    this.loadStock();
    
    // Debug: vérifie l'état après 1 seconde
    setTimeout(() => {
      console.log('📊 État après 1s:', {
        loading: this.loading,
        error: this.error,
        stock: this.stock,
        hasStock: !!this.stock,
        stockType: typeof this.stock
      });
    }, 1000);
  }, 100);
}

loadStock() {
  console.log('🔍 loadStock appelé, festivalId:', this.festivalId);
  this.loading = true;
  
  this.stockService.getStock(this.festivalId).subscribe({
    next: (data) => {
      console.log('✅ NEXT - Data reçue:', data);
      console.log('✅ Data type:', typeof data);
      console.log('✅ Data keys:', Object.keys(data || {}));
      
      this.stock = data;
      this.loading = false;
      
      // Force la détection
      this.cdr.detectChanges();
      
      // Vérifie après le changement
      setTimeout(() => {
        console.log('🔄 Après detectChanges - stock:', this.stock);
      });
    },
    error: (err) => {
      console.error('❌ ERROR:', err);
      this.error = err.message;
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}
}