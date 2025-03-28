import Database from "@tauri-apps/plugin-sql";
import { Snap } from "../types";

class DatabaseService {
  private static instance: DatabaseService;
  private db: Database | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async getConnection(): Promise<Database> {
    if (!this.db) {
      this.db = await Database.load("sqlite:snap.db");
    }
    return this.db;
  }

  async getAllSnaps(): Promise<Snap[]> {
    try {
      const db = await this.getConnection();
      return await db.select<Snap[]>("SELECT * FROM snaps");
    } catch (error) {
      console.error("Error fetching snaps:", error);
      throw new Error("Failed to get snaps from database");
    }
  }

  async insertSnap(snap: Omit<Snap, "id">): Promise<void> {
    try {
      const db = await this.getConnection();
      await db.execute(
        "INSERT INTO snaps (title, content, content_type, tags, created_at, embedding) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          snap.title,
          snap.content,
          snap.content_type,
          snap.tags.toString(),
          snap.created_at,
          snap.embedding,
        ]
      );
    } catch (error) {
      console.error("Error inserting snap:", error);
      throw new Error("Failed to insert snap into database");
    }
  }

  async deleteSnap(snapId: number): Promise<void> {
    try {
      const db = await this.getConnection();
      await db.execute("DELETE FROM snaps WHERE id = $1", [snapId]);
    } catch (error) {
      console.error("Error deleting snap:", error);
      throw new Error("Failed to delete snap from database");
    }
  }

  async searchSnaps(query: string): Promise<Snap[]> {
    try {
      const db = await this.getConnection();
      return await db.select<Snap[]>(
        `SELECT id, title, content, content_type, tags, created_at, embedding 
         FROM snaps INDEXED BY idx_snaps_title_content
         WHERE title LIKE $1 
         OR content LIKE $1 
         OR tags LIKE $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [`%${query}%`]
      );
    } catch (error) {
      console.error("Error searching snaps:", error);
      throw new Error("Failed to search snaps in database");
    }
  }

  async batchInsertSnaps(snaps: Omit<Snap, "id">[]): Promise<void> {
    try {
      const db = await this.getConnection();
      await db.execute(
        `BEGIN TRANSACTION;
         ${snaps
           .map(
             () =>
               "INSERT INTO snaps (title, content, content_type, tags, created_at, embedding) VALUES (?, ?, ?, ?, ?, ?)"
           )
           .join(";")}
         COMMIT;`,
        snaps.flatMap((snap) => [
          snap.title,
          snap.content,
          snap.content_type,
          snap.tags.toString(),
          snap.created_at,
          snap.embedding,
        ])
      );
    } catch (error) {
      console.error("Error batch inserting snaps:", error);
      throw new Error("Failed to batch insert snaps");
    }
  }
}

export const dbService = DatabaseService.getInstance();
