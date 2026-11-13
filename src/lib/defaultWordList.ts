export interface WordRule {
  id: string;
  triggerWord: string;
  mappedAction: string;
  category: 'study' | 'break' | 'music' | 'content' | 'day_boundary' | 'desk';
  description: string;
}

export const INITIAL_WORD_RULES: WordRule[] = [
  // Day boundaries
  { id: '1', triggerWord: 'login', mappedAction: 'day_start', category: 'day_boundary', description: 'Day start / desk arrival' },
  { id: '2', triggerWord: 'logout', mappedAction: 'day_end', category: 'day_boundary', description: 'Day end / desk departure' },
  { id: '3', triggerWord: 'log in', mappedAction: 'day_start', category: 'day_boundary', description: 'Day start variant' },
  { id: '4', triggerWord: 'log out', mappedAction: 'day_end', category: 'day_boundary', description: 'Day end variant' },

  // Desk status
  { id: '5', triggerWord: 'on desk', mappedAction: 'desk_on', category: 'desk', description: 'Seated at desk' },
  { id: '6', triggerWord: 'off desk', mappedAction: 'desk_off', category: 'desk', description: 'Stepped away from desk' },
  { id: '7', triggerWord: 'otd', mappedAction: 'desk_off', category: 'desk', description: 'Off the desk acronym' },
  { id: '8', triggerWord: 'luck off', mappedAction: 'desk_off', category: 'desk', description: 'Typo variant for off desk' },
  { id: '9', triggerWord: 'out', mappedAction: 'desk_off', category: 'desk', description: 'Out / away from desk' },
  { id: '10', triggerWord: 'off', mappedAction: 'desk_off', category: 'desk', description: 'Off desk general' },

  // Break bank triggers
  { id: '11', triggerWord: 'bon', mappedAction: 'break_start', category: 'break', description: 'Break start' },
  { id: '12', triggerWord: 'boff', mappedAction: 'break_stop', category: 'break', description: 'Break end' },
  { id: '13', triggerWord: 'break on', mappedAction: 'break_start', category: 'break', description: 'Break start full' },
  { id: '14', triggerWord: 'break off', mappedAction: 'break_stop', category: 'break', description: 'Break end full' },
  { id: '15', triggerWord: 'breakfast', mappedAction: 'break_meal', category: 'break', description: 'Breakfast break' },
  { id: '16', triggerWord: 'lunch', mappedAction: 'break_meal', category: 'break', description: 'Lunch break' },
  { id: '17', triggerWord: 'dinner', mappedAction: 'break_meal', category: 'break', description: 'Dinner break' },

  // Music (Riyaz)
  { id: '18', triggerWord: 'riyaz', mappedAction: 'music_tick', category: 'music', description: 'Riyaz done today tick' },
  { id: '19', triggerWord: 'riyaz on', mappedAction: 'music_start', category: 'music', description: 'Music riyaz start' },
  { id: '20', triggerWord: 'riyaz off', mappedAction: 'music_stop', category: 'music', description: 'Music riyaz stop' },
  { id: '21', triggerWord: 'music', mappedAction: 'music_tick', category: 'music', description: 'Music done tick' },

  // Study patterns
  { id: '22', triggerWord: 's on', mappedAction: 'study_start', category: 'study', description: 'Study session start with topic' },
  { id: '23', triggerWord: 's off', mappedAction: 'study_stop', category: 'study', description: 'Study session stop' },
  { id: '24', triggerWord: 'study on', mappedAction: 'study_start', category: 'study', description: 'Study start verbose' },
  { id: '25', triggerWord: 'study off', mappedAction: 'study_stop', category: 'study', description: 'Study stop verbose' },

  // Content patterns
  { id: '26', triggerWord: 'c on', mappedAction: 'content_start', category: 'content', description: 'Content session start' },
  { id: '27', triggerWord: 'c off', mappedAction: 'content_stop', category: 'content', description: 'Content session stop' },
  { id: '28', triggerWord: 'content on', mappedAction: 'content_start', category: 'content', description: 'Content start' },
  { id: '29', triggerWord: 'content off', mappedAction: 'content_stop', category: 'content', description: 'Content stop' },
];
