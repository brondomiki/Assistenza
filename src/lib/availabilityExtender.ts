import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSunday, addMonths, isAfter } from 'date-fns';

/**
 * Estende automaticamente le disponibilità delle badanti per i mesi futuri
 * che non hanno ancora disponibilità create.
 * 
 * Questa funzione viene chiamata quando si naviga nel calendario per garantire
 * che ci siano sempre disponibilità per i mesi futuri.
 */
export async function extendCaregiverAvailability(userId: string, targetMonth: Date) {
  try {
    // Controlla se ci sono già disponibilità per il mese target
    const monthStart = format(startOfMonth(targetMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(targetMonth), 'yyyy-MM-dd');

    const { data: existingData } = await supabase
      .from('caregiver_availability')
      .select('id')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .limit(1);

    // Se ci sono già disponibilità, non fare nulla
    if (existingData && existingData.length > 0) {
      return;
    }

    // Controlla se il mese target è nel futuro (rispetto al mese corrente + 11 mesi)
    const now = new Date();
    const maxCoveredMonth = addMonths(startOfMonth(now), 11);
    
    // Se il mese target è oltre il periodo già coperto, estendi
    if (isAfter(targetMonth, maxCoveredMonth)) {
      // Crea disponibilità per i prossimi 6 mesi a partire dal mese target
      const startDate = startOfMonth(targetMonth);
      const endDate = addMonths(startDate, 6);
      
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });

      const availabilities = allDays
        .filter(day => !isSunday(day)) // Escludi domenica
        .map(day => ({
          user_id: userId,
          date: format(day, 'yyyy-MM-dd'),
          status: 'disponibile' as const,
          start_time: '08:00',
          end_time: '12:00',
        }));

      if (availabilities.length > 0) {
        // Inserisci in batch
        const batchSize = 100;
        for (let i = 0; i < availabilities.length; i += batchSize) {
          const batch = availabilities.slice(i, i + batchSize);
          await supabase.from('caregiver_availability').insert(batch);
        }
      }
    }
  } catch (error) {
    console.error('Errore nell\'estensione disponibilità:', error);
  }
}
