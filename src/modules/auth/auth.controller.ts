import { Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/supabase';

export const syncUser = async (req: Request, res: Response): Promise<void> => {
  console.log('API hit: /auth/sync-user. User:', req.user?.id);
  try {
    const user = req.user;
    if (!user) {
      console.log('syncUser: No user in request');
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const { id, email, role, user_type } = user;
    const fallbackName = req.body.display_name || email.split('@')[0];

    const today = new Date().toISOString().split('T')[0];

    // Get current user data to check last_active_date and preserve display_name
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('display_name, last_active_date, current_streak_days')
      .eq('id', id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error fetching existing user:', checkError);
    }

    let newStreak = existingUser?.current_streak_days || 0;
    const lastActive = existingUser?.last_active_date;
    const finalDisplayName = existingUser?.display_name || fallbackName;

    if (lastActive) {
      const lastDate = new Date(lastActive);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1; // First day
    }

    console.log('Upserting user:', id, email, user_type, newStreak);

    // Upsert user
    const { data: upsertedUser, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id,
        email,
        user_type,
        display_name: finalDisplayName,
        last_active_date: today,
        current_streak_days: newStreak,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select('id, email, display_name, user_type, total_xp, current_streak_days')
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      res.status(500).json({ error: 'failed_to_sync_user' });
      return;
    }

    console.log('User synced successfully:', upsertedUser.id);

    res.json({
      ...upsertedUser,
      role // Role from JWT
    });

  } catch (error) {
    console.error('Error in syncUser:', error);
    res.status(500).json({ error: 'internal_server_error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const { id, role } = user;

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'user_not_found' });
        return;
      }
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'failed_to_fetch_user' });
      return;
    }

    res.json({
      ...userData,
      role
    });

  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ error: 'internal_server_error' });
  }
};
