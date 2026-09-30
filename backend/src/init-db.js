import pool from "./db.js";
import bcrypt from "bcrypt";

const createTables = async () => {
  try {
    console.log("Creating tables...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(15) NOT NULL,
        address TEXT NOT NULL,
        business_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        otp_hash VARCHAR(255) NOT NULL,
        attempts INTEGER DEFAULT 0,
        expires_at TIMESTAMP NOT NULL,
        last_sent_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_tasks (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, task_id)
      );
    `);

    console.log("Tables created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

const seedData = async () => {
  try {
    console.log("Seeding data...");

    // Seed Categories
    const categories = [
      "Home Cleaning",
      "Repairs & Maintenance",
      "Personal Errands",
      "Event Help",
    ];
    for (const cat of categories) {
      await pool.query(
        "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
        [cat],
      );
    }

    // Fetch category IDs
    const catRes = await pool.query("SELECT id, name FROM categories");
    const catMap = {};
    catRes.rows.forEach((r) => (catMap[r.name] = r.id));

    // Seed Tasks (20 tasks across 4 categories)
    const tasks = [
      {
        name: "Deep Cleaning",
        desc: "Thorough cleaning of all rooms",
        cat: "Home Cleaning",
      },
      {
        name: "Bathroom Cleaning",
        desc: "Deep clean of bathrooms",
        cat: "Home Cleaning",
      },
      {
        name: "Kitchen Cleaning",
        desc: "Deep clean of kitchen and appliances",
        cat: "Home Cleaning",
      },
      {
        name: "Sofa Cleaning",
        desc: "Dry and wet cleaning of sofas",
        cat: "Home Cleaning",
      },
      {
        name: "Carpet Cleaning",
        desc: "Vacuum and wash carpets",
        cat: "Home Cleaning",
      },

      {
        name: "Plumbing Repair",
        desc: "Fix leaks and pipe issues",
        cat: "Repairs & Maintenance",
      },
      {
        name: "Electrical Work",
        desc: "Fix wiring and electrical appliances",
        cat: "Repairs & Maintenance",
      },
      {
        name: "AC Service",
        desc: "Regular maintenance of AC units",
        cat: "Repairs & Maintenance",
      },
      {
        name: "Carpentry",
        desc: "Furniture repair and assembly",
        cat: "Repairs & Maintenance",
      },
      {
        name: "Painting",
        desc: "Wall painting and touch-ups",
        cat: "Repairs & Maintenance",
      },

      {
        name: "Grocery Delivery",
        desc: "Pick up and deliver groceries",
        cat: "Personal Errands",
      },
      {
        name: "Medicine Delivery",
        desc: "Pick up prescriptions",
        cat: "Personal Errands",
      },
      {
        name: "Document Courier",
        desc: "Deliver important documents securely",
        cat: "Personal Errands",
      },
      {
        name: "Bill Payments",
        desc: "Offline bill payment assistance",
        cat: "Personal Errands",
      },
      {
        name: "Laundry Pickup",
        desc: "Drop and pick up laundry",
        cat: "Personal Errands",
      },

      {
        name: "Party DecorSetup",
        desc: "Help setting up decorations",
        cat: "Event Help",
      },
      {
        name: "Event Serving",
        desc: "Waitstaff for small parties",
        cat: "Event Help",
      },
      {
        name: "Post-Event Cleanup",
        desc: "Cleaning up after the event",
        cat: "Event Help",
      },
      {
        name: "Gift Packing",
        desc: "Wrapping and packing gifts",
        cat: "Event Help",
      },
      {
        name: "Photography Assist",
        desc: "Help with lighting and props",
        cat: "Event Help",
      },
    ];

    for (const task of tasks) {
      const catId = catMap[task.cat];
      if (catId) {
        await pool.query(
          "INSERT INTO tasks (category_id, name, description) SELECT $1::integer, $2::varchar, $3::text WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE name = $2 AND category_id = $1)",
          [catId, task.name, task.desc],
        );
      }
    }

    console.log("Data seeded successfully.");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

const run = async () => {
  await createTables();
  await seedData();
  pool.end();
};

run();
