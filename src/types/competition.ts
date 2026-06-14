export interface Competition {
    competition_id: string
    competition_name: string
    season_id?: string
    season_name?: string
    [key: string]: unknown
}

export interface Category {
    category_id: string
    category_name: string
    competition_id?: string
    [key: string]: unknown
}

export interface Season {
    season_id: string
    season_name: string
    competition_id?: string
    [key: string]: unknown
}