import { Injectable } from "@angular/core";
import { signal } from "@angular/core";
import { inject } from "@angular/core";
import { ReservantApiService } from "../services/reservant-api";
import { ReservantDto } from "../types/reservant-dto";
import { finalize, tap } from "rxjs";
@Injectable({
    providedIn: 'root',
})
export class ReservantStore {

    private readonly api = inject(ReservantApiService);
    private readonly _reservants = signal<ReservantDto[]>([]);

    public readonly reservants = this._reservants.asReadonly();
    loading = signal(false);
    error = signal<string | null>(null);

    loadAll(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (reservants) => {
                this._reservants.set(reservants);
            },
            error: (error) => {
                console.error('Error loading reservants:', error);
            },
        });
    }
    loadById(id: number): void {
        this.loading.set(true);
        this.api.getbyid(id).subscribe({
            next: (reservant) => {
                this._reservants.set([reservant]);
            },
            error: (error) => {
                console.error('Error loading reservant:', error);
            },
        });
    }
    create(reservant: ReservantDto): void {
        this.loading.set(true);
        this.error.set(null);
        this.api.create(reservant).subscribe({
            next: (newReservant) => {
                // Append to existing list instead of replacing
                this._reservants.set([...this._reservants(), newReservant]);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error creating reservant:', error);
                this.error.set(error.message || 'Erreur lors de la création');
                this.loading.set(false);
            },
        });
    }
    update(reservant: ReservantDto) {
        this.loading.set(true);
        return this.api.update(reservant).pipe(
            tap((updated) => this._reservants.set([updated])),
            finalize(() => this.loading.set(false)),
        );
    }
    delete(reservant: ReservantDto): void {
        this.loading.set(true);
        this.api.delete(reservant).subscribe({
            next: (reservant) => {
                this._reservants.set([reservant]);
            },
            error: (error) => {
                console.error('Error deleting reservant:', error);
            },
        });
    }
}
