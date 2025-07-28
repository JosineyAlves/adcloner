import { promises as fs } from 'fs'
import path from 'path'

export interface Template {
  id: string
  name: string
  description: string
  fileName: string
  processedAt: string
  campaignCount: number
  status: 'active' | 'inactive'
  processedData: any[]
}

class TemplateStorage {
  private storagePath: string

  constructor() {
    // Em produção, usar um banco de dados real
    this.storagePath = path.join(process.cwd(), 'data', 'templates.json')
  }

  private async ensureStorageDir() {
    const dir = path.dirname(this.storagePath)
    try {
      await fs.access(dir)
    } catch {
      await fs.mkdir(dir, { recursive: true })
    }
  }

  private async readTemplates(): Promise<Template[]> {
    try {
      await this.ensureStorageDir()
      const data = await fs.readFile(this.storagePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      // Se o arquivo não existe, retornar array vazio
      return []
    }
  }

  private async writeTemplates(templates: Template[]): Promise<void> {
    await this.ensureStorageDir()
    await fs.writeFile(this.storagePath, JSON.stringify(templates, null, 2))
  }

  async getAllTemplates(): Promise<Template[]> {
    return await this.readTemplates()
  }

  async getTemplateById(id: string): Promise<Template | null> {
    const templates = await this.readTemplates()
    return templates.find(t => t.id === id) || null
  }

  async createTemplate(template: Omit<Template, 'id'>): Promise<Template> {
    const templates = await this.readTemplates()
    const newTemplate: Template = {
      ...template,
      id: Date.now().toString()
    }
    
    templates.push(newTemplate)
    await this.writeTemplates(templates)
    
    return newTemplate
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
    const templates = await this.readTemplates()
    const index = templates.findIndex(t => t.id === id)
    
    if (index === -1) {
      return null
    }
    
    templates[index] = { ...templates[index], ...updates }
    await this.writeTemplates(templates)
    
    return templates[index]
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const templates = await this.readTemplates()
    const filteredTemplates = templates.filter(t => t.id !== id)
    
    if (filteredTemplates.length === templates.length) {
      return false // Template não encontrado
    }
    
    await this.writeTemplates(filteredTemplates)
    return true
  }

  async initializeWithDefaultData(): Promise<void> {
    const templates = await this.readTemplates()
    
    // Se não há templates, criar dados padrão
    if (templates.length === 0) {
      const defaultTemplate: Template = {
        id: '1',
        name: 'Campanha de Conversão',
        description: 'Template para campanhas de conversão',
        fileName: 'conversao.csv',
        processedAt: '2024-01-15T10:30:00Z',
        campaignCount: 2,
        status: 'active',
        processedData: [
          {
            'Campaign Name': 'Campanha Teste 1',
            'Campaign Objective': 'LINK_CLICKS',
            'Campaign Status': 'PAUSED',
            'Ad Set Name': 'Conjunto Teste 1',
            'Ad Set Daily Budget': '1000',
            'Countries': 'BR',
            'Ad Name': 'Anúncio Teste 1',
            'Title': 'Título do Anúncio',
            'Body': 'Descrição do anúncio',
            'Link': 'https://example.com',
            'Campaign ID': '',
            'Ad Set ID': '',
            'Ad ID': ''
          },
          {
            'Campaign Name': 'Campanha Teste 2',
            'Campaign Objective': 'CONVERSIONS',
            'Campaign Status': 'PAUSED',
            'Ad Set Name': 'Conjunto Teste 2',
            'Ad Set Daily Budget': '2000',
            'Countries': 'BR',
            'Ad Name': 'Anúncio Teste 2',
            'Title': 'Título do Anúncio 2',
            'Body': 'Descrição do anúncio 2',
            'Link': 'https://example2.com',
            'Campaign ID': '',
            'Ad Set ID': '',
            'Ad ID': ''
          }
        ]
      }
      
      await this.writeTemplates([defaultTemplate])
    }
  }
}

export const templateStorage = new TemplateStorage() 