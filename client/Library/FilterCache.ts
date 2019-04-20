import { Listable } from "../../common/Listable";
import { KeyValueSet } from "../../common/Toolbox";
import { Listing, ListingOrigin } from "./Listing";

export function DedupeByRankAndFilterListings<T extends Listing<Listable>>(
  parentSubset: T[],
  filter: string
) {
  const byName: T[] = [];
  const bySearchHint: T[] = [];
  const dedupedStatBlocks: KeyValueSet<T> = {};
  const sourceRankings: ListingOrigin[] = ["account", "localStorage", "server"];

  parentSubset.forEach(newListing => {
    const dedupeKey =
      newListing.Listing().Path + "-" + newListing.Listing().Name;
    const currentListing = dedupedStatBlocks[dedupeKey];
    if (currentListing) {
      const hasBetterSource =
        sourceRankings.indexOf(newListing.Origin) <
        sourceRankings.indexOf(currentListing.Origin);
      if (hasBetterSource) {
        dedupedStatBlocks[dedupeKey] = newListing;
      }
    } else {
      dedupedStatBlocks[dedupeKey] = newListing;
    }
  });

  Object.keys(dedupedStatBlocks)
    .sort()
    .forEach(i => {
      const listing = dedupedStatBlocks[i];
      if (
        listing
          .Listing()
          .Name.toLocaleLowerCase()
          .indexOf(filter) > -1
      ) {
        byName.push(listing);
      } else if (
        listing
          .Listing()
          .SearchHint.toLocaleLowerCase()
          .indexOf(filter) > -1
      ) {
        bySearchHint.push(listing);
      }
    });

  return byName.concat(bySearchHint);
}

export class FilterCache<T extends Listing<Listable>> {
  private allItems: T[];
  constructor(private initialItems: T[]) {
    this.initializeItems(initialItems);
  }

  private filterCache: KeyValueSet<T[]> = {};

  public UpdateIfItemsChanged(newItems) {
    if (newItems != this.initialItems) {
      this.filterCache = {};
      this.initializeItems(newItems);
    }
  }

  public GetFilteredEntries = (filter: string) => {
    if (this.filterCache[filter]) {
      return this.filterCache[filter];
    }

    const parentSubset =
      this.filterCache[filter.substr(0, filter.length - 1)] || this.allItems;

    const finalList = DedupeByRankAndFilterListings(parentSubset, filter);

    this.filterCache[filter] = finalList;

    return finalList;
  };

  private initializeItems(items: T[]) {
    this.allItems = items.filter(i => {
      if (!(i.Listing().Name && i.Listing().Name.length)) {
        console.warn("Removing unnamed statblock: " + JSON.stringify(i));
        return false;
      }
      return true;
    });
  }
}
