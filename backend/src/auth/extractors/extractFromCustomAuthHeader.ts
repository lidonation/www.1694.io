import { Request } from 'express';

export const customAuthHeaderExtractor = function (req: Request): string | null {
    let token: string | null = null;
    if (req && req.headers && req.headers['authorization-1694']) {
        const authHeader = req.headers['authorization-1694'] as string;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    return token;
};
