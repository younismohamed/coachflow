export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'admin' | 'manager' | 'employee';
export type CoachingType = 'performance' | 'development' | 'behavioral' | 'goal_setting' | 'feedback' | 'disciplinary' | 'other';
export type CoachingStatus = 'pending' | 'acknowledged';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          name: string;
          email: string;
          department: string | null;
          position: string | null;
          manager_id: string | null;
          profile_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          department?: string | null;
          position?: string | null;
          manager_id?: string | null;
          profile_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          department?: string | null;
          position?: string | null;
          manager_id?: string | null;
          profile_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      coaching_records: {
        Row: {
          id: string;
          employee_id: string;
          coach_id: string;
          coaching_type: CoachingType;
          notes: string;
          action_plan: string | null;
          status: CoachingStatus;
          acknowledgment_token: string;
          acknowledged_at: string | null;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          coach_id: string;
          coaching_type: CoachingType;
          notes: string;
          action_plan?: string | null;
          status?: CoachingStatus;
          acknowledgment_token?: string;
          acknowledged_at?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          employee_id?: string;
          coach_id?: string;
          coaching_type?: CoachingType;
          notes?: string;
          action_plan?: string | null;
          status?: CoachingStatus;
          acknowledged_at?: string | null;
          reminder_sent_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
  };
}

// Joined types for convenience
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Employee = Database['public']['Tables']['employees']['Row'];
export type CoachingRecord = Database['public']['Tables']['coaching_records']['Row'];

export type CoachingRecordWithRelations = CoachingRecord & {
  employee: Pick<Employee, 'id' | 'name' | 'email' | 'department' | 'position'>;
  coach: Pick<Profile, 'id' | 'name' | 'email' | 'avatar_url'>;
};

export type EmployeeWithManager = Employee & {
  manager: Pick<Profile, 'id' | 'name' | 'email'> | null;
};
