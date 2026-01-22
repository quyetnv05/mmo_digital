import { prisma } from '@/lib/prisma';

/**
 * Get a system setting value by key
 * @param key The setting key
 * @param defaultValue Optional default value if not found
 * @returns The setting value string or defaultValue
 */
export async function getSetting(key: string, defaultValue?: string): Promise<string | undefined> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key },
            select: { value: true },
        });

        return setting?.value ?? defaultValue;
    } catch (error) {
        console.error(`Error fetching setting ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Get multiple settings by group
 * @param group The setting group (GENERAL, FINANCE, SUPPORT)
 */
export async function getSettingsByGroup(group: string) {
    try {
        return await prisma.systemSetting.findMany({
            where: { group },
        });
    } catch (error) {
        console.error(`Error fetching settings group ${group}:`, error);
        return [];
    }
}

/**
 * Helper to get an integer setting safely
 */
export async function getIntSetting(key: string, defaultValue: number): Promise<number> {
    const val = await getSetting(key);
    if (val === undefined || val === null) return defaultValue;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Helper to get a boolean setting safely
 */
export async function getBoolSetting(key: string, defaultValue: boolean): Promise<boolean> {
    const val = await getSetting(key);
    if (val === undefined || val === null) return defaultValue;
    return val.toLowerCase() === 'true';
}
