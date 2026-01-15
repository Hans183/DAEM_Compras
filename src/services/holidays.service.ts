export interface Holiday {
    date: string;
    title: string;
    type: string;
    inalienable: boolean;
    extra: string;
}

const HOLIDAYS_API_URL = "https://api.boostr.cl/holidays.json";
const CACHE_KEY_PREFIX = "holidays_cache_";

export async function getHolidays(year: number): Promise<Holiday[]> {
    // Check local storage (client-side only)
    if (typeof window !== "undefined") {
        const cacheKey = `${CACHE_KEY_PREFIX}${year}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // Cache valid for 24 hours
                if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                    return parsed.data;
                }
            } catch (e) {
                console.warn("Invalid holiday cache", e);
                localStorage.removeItem(cacheKey);
            }
        }
    }

    try {
        const response = await fetch(HOLIDAYS_API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch holidays: ${response.statusText}`);
        }
        const json = await response.json();

        // The API returns { status: "success", data: [...] }
        const holidays: Holiday[] = json.data || [];

        // Cache the result
        if (typeof window !== "undefined") {
            const cacheKey = `${CACHE_KEY_PREFIX}${year}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: holidays
            }));
        }

        return holidays;
    } catch (error) {
        console.error("Error fetching holidays:", error);
        // Return empty array to allow the app to continue (will just count weekends)
        return [];
    }
}
