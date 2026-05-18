import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  image: string;
  url: string;
  published_at: string;
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private http = inject(HttpClient);
  private apiKey = '8490e69717d0b171cb3ae177c0217007';

  getNews(category: string): Observable<NewsArticle[]> {
    const url = `/mediastack-api/news?access_key=${this.apiKey}&categories=${category}&limit=6&sort=popularity&languages=es,en`;
    return this.http.get<any>(url).pipe(
      map(res => {
        if (!res?.data || !Array.isArray(res.data) || res.data.length === 0) return [];
        return res.data.map((item: any) => ({
          title: item.title || 'Sin titulo',
          description: item.description || '',
          source: item.source || 'Fuente desconocida',
          image: item.image || '',
          url: item.url || '#',
          published_at: item.published_at || '',
        }));
      }),
      catchError(() => of([])),
    );
  }
}
