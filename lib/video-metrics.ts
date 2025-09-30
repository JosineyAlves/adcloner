// Sistema de Métricas de Vídeo do Meta API
// Busca métricas de vídeo diretamente dos vídeos dos anúncios

export interface VideoInsights {
    video_views: number
    video_views_25: number
    video_views_50: number
    video_views_75: number
    video_views_95: number
    video_views_100: number
  }
  
  export interface VideoKPIs {
    holdRate: number // Vídeos assistidos 75% / impressões (%)
    bodyConversion: number // (Compras / Vídeos assistidos 75%) (%)
    bodyRetention: number // Vídeos assistidos 75% / Vídeos iniciados (%)
    ctaRate: number // (Cliques no Link / Vídeos assistidos 75%) (%)
    hookPlayRate: number // Vídeos iniciados / Impressões (%)
  }
  
  export class VideoMetricsAPI {
    private baseUrl = 'https://graph.facebook.com/v23.0'
  
    /**
     * Busca métricas de vídeo para um vídeo específico
     */
    async getVideoInsights(videoId: string, accessToken: string): Promise<VideoInsights> {
      try {
        const response = await fetch(
          `${this.baseUrl}/${videoId}/insights?fields=video_views,video_views_25,video_views_50,video_views_75,video_views_95,video_views_100&access_token=${accessToken}`
        )
        
        const data = await response.json()
        
        if (data.data && data.data.length > 0) {
          const insights = data.data.reduce((acc: any, item: any) => {
            acc[item.name] = parseInt(item.values[0].value || '0')
            return acc
          }, {})
          
          return {
            video_views: insights.video_views || 0,
            video_views_25: insights.video_views_25 || 0,
            video_views_50: insights.video_views_50 || 0,
            video_views_75: insights.video_views_75 || 0,
            video_views_95: insights.video_views_95 || 0,
            video_views_100: insights.video_views_100 || 0
          }
        }
        
        return this.getEmptyVideoInsights()
      } catch (error) {
        console.error('Erro ao buscar métricas de vídeo:', error)
        return this.getEmptyVideoInsights()
      }
    }
  
    /**
     * Calcula KPIs de vídeo
     */
    calculateVideoKPIs(
      videoInsights: VideoInsights,
      impressions: number,
      clicks: number,
      conversions: number
    ): VideoKPIs {
      const { video_views, video_views_75 } = videoInsights
  
      return {
        // Hold Rate - Vídeos assistidos 75% / impressões (%)
        holdRate: impressions > 0 ? (video_views_75 / impressions) * 100 : 0,
        
        // Conversão do Body - (Compras / Vídeos assistidos 75%) (%)
        bodyConversion: video_views_75 > 0 ? (conversions / video_views_75) * 100 : 0,
        
        // Retenção do Body - Vídeos assistidos 75% / Vídeos iniciados (%)
        bodyRetention: video_views > 0 ? (video_views_75 / video_views) * 100 : 0,
        
        // CTA - (Cliques no Link / Vídeos assistidos 75%) (%)
        ctaRate: video_views_75 > 0 ? (clicks / video_views_75) * 100 : 0,
        
        // Play Rate do Hook - Vídeos iniciados / Impressões (%)
        hookPlayRate: impressions > 0 ? (video_views / impressions) * 100 : 0
      }
    }
  
    private getEmptyVideoInsights(): VideoInsights {
      return {
        video_views: 0,
        video_views_25: 0,
        video_views_50: 0,
        video_views_75: 0,
        video_views_95: 0,
        video_views_100: 0
      }
    }
  }
  
  export const videoMetricsAPI = new VideoMetricsAPI()