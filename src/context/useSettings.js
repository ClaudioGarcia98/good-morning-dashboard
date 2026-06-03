import { useContext } from 'react';
import { SettingsContext } from './Context';

export const useSettings = () => useContext(SettingsContext);
