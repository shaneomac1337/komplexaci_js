// Service for fetching game data (items, spells, runes)

interface ItemData {
  name: string;
  description: string;
  plaintext: string;
  gold: {
    base: number;
    total: number;
    sell: number;
  };
  stats: Record<string, number>;
  image: {
    full: string;
    sprite: string;
    group: string;
  };
}

interface SpellData {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  cooldown: number[];
  image: {
    full: string;
    sprite: string;
    group: string;
  };
}

interface RuneData {
  id: number;
  key: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  icon: string;
}

class GameDataService {
  private itemCache: Map<number, ItemData> = new Map();
  private spellCache: Map<number, SpellData> = new Map();
  private runeCache: Map<number, RuneData> = new Map();
  private lastFetch: number = 0;
  private cacheExpiry: number = 3600000; // 1 hour

  async getLatestVersion(): Promise<string> {
    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      const versions = await response.json();
      return versions[0];
    } catch (error) {
      console.error('Failed to fetch latest version:', error);
      return '15.10.1'; // Fallback version
    }
  }

  async getItemData(): Promise<Map<number, ItemData>> {
    const now = Date.now();
    
    if (this.itemCache.size > 0 && (now - this.lastFetch) < this.cacheExpiry) {
      return this.itemCache;
    }

    try {
      const version = await this.getLatestVersion();
      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`
      );
      const data = await response.json();

      this.itemCache.clear();
      Object.entries(data.data).forEach(([itemId, item]: [string, any]) => {
        this.itemCache.set(parseInt(itemId), item as ItemData);
      });

      this.lastFetch = now;
      return this.itemCache;
    } catch (error) {
      console.error('Failed to fetch item data:', error);
      return this.itemCache;
    }
  }

  async getSpellData(): Promise<Map<number, SpellData>> {
    if (this.spellCache.size > 0) {
      return this.spellCache;
    }

    try {
      const version = await this.getLatestVersion();
      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`
      );
      const data = await response.json();

      // Map spell IDs to spell data
      const spellMapping: Record<number, string> = {
        1: 'SummonerBoost',
        3: 'SummonerExhaust', 
        4: 'SummonerFlash',
        6: 'SummonerHaste',
        7: 'SummonerHeal',
        11: 'SummonerSmite',
        12: 'SummonerTeleport',
        13: 'SummonerMana',
        14: 'SummonerDot',
        21: 'SummonerBarrier',
        30: 'SummonerPoroRecall',
        31: 'SummonerPoroThrow',
        32: 'SummonerSnowball'
      };

      Object.entries(spellMapping).forEach(([spellId, spellKey]) => {
        const spellData = data.data[spellKey];
        if (spellData) {
          this.spellCache.set(parseInt(spellId), spellData as SpellData);
        }
      });

      return this.spellCache;
    } catch (error) {
      console.error('Failed to fetch spell data:', error);
      return this.spellCache;
    }
  }

  async getRuneData(): Promise<Map<number, RuneData>> {
    if (this.runeCache.size > 0) {
      return this.runeCache;
    }

    try {
      const version = await this.getLatestVersion();
      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`
      );
      const data = await response.json();

      data.forEach((tree: any) => {
        tree.slots.forEach((slot: any) => {
          slot.runes.forEach((rune: any) => {
            this.runeCache.set(rune.id, rune as RuneData);
          });
        });
      });

      return this.runeCache;
    } catch (error) {
      console.error('Failed to fetch rune data:', error);
      return this.runeCache;
    }
  }

  async getItemById(itemId: number): Promise<ItemData | null> {
    const items = await this.getItemData();
    return items.get(itemId) || null;
  }

  async getSpellById(spellId: number): Promise<SpellData | null> {
    const spells = await this.getSpellData();
    return spells.get(spellId) || null;
  }

  async getRuneById(runeId: number): Promise<RuneData | null> {
    const runes = await this.getRuneData();
    return runes.get(runeId) || null;
  }

  // Helper function to clean HTML from descriptions
  cleanDescription(description: string): string {
    return description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .trim();
  }

  // Format gold values
  formatGold(gold: number): string {
    return `${gold.toLocaleString()} gold`;
  }

  // Format stats
  formatStats(stats: Record<string, number>): string {
    const statNames: Record<string, string> = {
      'FlatHPPoolMod': 'Health',
      'FlatMPPoolMod': 'Mana',
      'FlatArmorMod': 'Armor',
      'FlatSpellBlockMod': 'Magic Resist',
      'FlatPhysicalDamageMod': 'Attack Damage',
      'FlatMagicDamageMod': 'Ability Power',
      'PercentAttackSpeedMod': 'Attack Speed',
      'PercentMovementSpeedMod': 'Movement Speed',
      'FlatCritChanceMod': 'Critical Strike Chance',
      'PercentLifeStealMod': 'Life Steal',
      'PercentSpellVampMod': 'Spell Vamp'
    };

    return Object.entries(stats)
      .map(([key, value]) => {
        const statName = statNames[key] || key;
        const formattedValue = key.includes('Percent') ? `${(value * 100).toFixed(1)}%` : value.toString();
        return `+${formattedValue} ${statName}`;
      })
      .join('\n');
  }
}

// Singleton instance
export const gameDataService = new GameDataService();

// Helper functions for components
export async function getItemTooltip(itemId: number): Promise<string> {
  if (itemId === 0) return '';

  const item = await gameDataService.getItemById(itemId);
  if (!item) return `Item ${itemId}`;

  let tooltip = `${item.name}\n`;

  if (item.plaintext) {
    tooltip += `${item.plaintext}\n\n`;
  }

  if (item.stats && Object.keys(item.stats).length > 0) {
    tooltip += `${gameDataService.formatStats(item.stats)}\n\n`;
  }

  tooltip += `Cost: ${gameDataService.formatGold(item.gold.total)}`;

  if (item.description) {
    tooltip += `\n\n${gameDataService.cleanDescription(item.description)}`;
  }

  return tooltip;
}

export async function getSpellTooltip(spellId: number): Promise<string> {
  const spell = await gameDataService.getSpellById(spellId);
  if (!spell) return `Spell ${spellId}`;

  let tooltip = `${spell.name}\n`;
  tooltip += `Cooldown: ${spell.cooldown[0]}s\n\n`;
  tooltip += gameDataService.cleanDescription(spell.description);

  return tooltip;
}
