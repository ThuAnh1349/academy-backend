import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'member';
        user_type: 'internal' | 'community';
      };
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'missing_token' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Dùng supabaseAdmin (service_role) để verify token — hỗ trợ cả HS256 và ES256
    // supabaseAdmin nhanh hơn supabaseAnon vì không bị rate limit
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.log('Auth middleware: getUser failed:', error?.message || 'no user');
      res.status(401).json({ error: 'invalid_token' });
      return;
    }

    const email = user.email || '';
    const role = user.app_metadata?.role || 'member';
    const user_type = user.app_metadata?.user_type || 'community';

    console.log(`Auth OK: ${email} | role=${role}`);

    req.user = {
      id: user.id,
      email,
      role,
      user_type,
    };

    next();
  } catch (error: any) {
    console.log('Auth middleware: Unexpected error:', error.message);
    res.status(500).json({ error: 'internal_server_error' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  next();
};
