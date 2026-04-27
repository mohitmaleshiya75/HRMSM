export type AnnouncementResponseT = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_by: string;
  created_by_name: string;
  created_at: string;
};

export type AddEditAnnouncementRequestT = {
  title: string;
  message: string;
  is_active?: boolean;
}; 