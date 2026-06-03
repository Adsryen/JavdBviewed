export type NewWorksFilterValue = 'all' | 'unread' | 'today' | 'week';

export interface NewWorksFilters {
  search: string;
  filter: NewWorksFilterValue;
  sort: string;
}

export type NewWorksQueryFilters = Partial<NewWorksFilters> & {
  page?: number;
  pageSize?: number;
};
