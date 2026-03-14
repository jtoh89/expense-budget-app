/**
 * Add your database types here.
 * Define manually based on your SQL schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Example - replace with your actual table types:
// export interface Database {
//   public: {
//     Tables: {
//       cards: {
//         Row: { id: string; owner: string; name: string; created_at: string };
//         Insert: { owner: string; name: string };
//         Update: Partial<{ owner: string; name: string }>;
//       };
//       // ... other tables
//     };
//   };
// }
