
import { useState, useEffect } from 'react';
import { ContentItem, UnitData } from '../types';
import { shuffleArray } from '../components/languageUtils';

export const useContentLoader = (unitNumbers: number[]) => {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Clear content if no units are selected
        if (unitNumbers.length === 0) {
            setContent([]);
            return;
        }

        const loadContent = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const loadedItems: ContentItem[] = [];
                
                // Create an array of fetch promises
                const fetchPromises = unitNumbers.map(num => 
                    fetch(`/data/unit${num}.json`).then(res => {
                        if (!res.ok) {
                            throw new Error(`Failed to fetch unit ${num} data.`);
                        }
                        return res.json() as Promise<UnitData>;
                    })
                );
                
                // Wait for all JSON files to be fetched and parsed
                const allUnitData = await Promise.all(fetchPromises);
                
                // Extract content and push to our items array
                for (const unitData of allUnitData) {
                    if (unitData && Array.isArray(unitData.contentItems)) {
                       loadedItems.push(...unitData.contentItems);
                    }
                }
                
                // Deduplicate the items based on the unique 'Romaji' property
                const uniqueItemsMap = new Map<string, ContentItem>();
                for (const item of loadedItems) {
                    if (!uniqueItemsMap.has(item.Romaji)) {
                        uniqueItemsMap.set(item.Romaji, item);
                    }
                }
                const uniqueContentItems = Array.from(uniqueItemsMap.values());

                setContent(shuffleArray(uniqueContentItems));

            } catch (err) {
                console.error("Failed to load unit data:", err);
                setError(err instanceof Error ? err : new Error('An unknown error occurred while loading content.'));
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(unitNumbers)]); // Re-run when the array of unit numbers changes

    return { content, isLoading, error };
};