export interface AdminLoginResponse {
    token: string;
    expiresIn: string;
}

export interface AdminStats {
    totalUsers: number;
    totalFemales: number;
    totalMales: number;
    totalClaimed: number;
}
