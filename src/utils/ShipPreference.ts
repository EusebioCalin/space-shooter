import { supabase } from '../lib/supabase';
import { getSession } from '../lib/auth';

export type ShipType = 'xwing' | 'awing' | 'ywing';

const SHIP_KEY = 'selected_ship';
export const DEFAULT_SHIP: ShipType = 'xwing';

/** Synchronous read from localStorage — used by GameScene on create(). */
export function getSelectedShip(): ShipType {
  return (localStorage.getItem(SHIP_KEY) as ShipType) ?? DEFAULT_SHIP;
}

/**
 * Fetch the ship preference from the DB (logged-in users) or localStorage (guests).
 * Always syncs the result back to localStorage so GameScene can read it synchronously.
 * Called by MenuScene (background sync) and ProfileScene (on mount).
 */
export async function loadShipPreference(): Promise<ShipType> {
  const session = await getSession();
  if (!session) return getSelectedShip();

  const { data } = await supabase
    .from('user_preferences')
    .select('selected_ship')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const ship = (data?.selected_ship as ShipType | undefined) ?? DEFAULT_SHIP;
  localStorage.setItem(SHIP_KEY, ship);
  return ship;
}

/**
 * Save the ship preference — immediately to localStorage, then to the DB if logged in.
 * Called by ProfileScene when the user taps a ship panel.
 */
export async function saveShipPreference(ship: ShipType): Promise<void> {
  localStorage.setItem(SHIP_KEY, ship);

  const session = await getSession();
  if (!session) return;

  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: session.user.id, selected_ship: ship, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}
