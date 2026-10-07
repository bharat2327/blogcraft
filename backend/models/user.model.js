const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Ensure data directory exists
const dataDir = path.dirname(USERS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Seed default demo user if file missing or empty
function initUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('password123', salt);
    const initialUsers = [
      {
        id: 1,
        name: 'Demo User',
        email: 'demo@example.com',
        password: hashedPassword,
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');
  }
}

initUsersFile();

const UserModel = {
  async getAll() {
    initUsersFile();
    try {
      const data = await fs.promises.readFile(USERS_FILE, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (err) {
      return [];
    }
  },

  async findById(id) {
    const users = await this.getAll();
    return users.find(u => Number(u.id) === Number(id)) || null;
  },

  async findByEmail(email) {
    if (!email) return null;
    const users = await this.getAll();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  async create({ name, email, password }) {
    const users = await this.getAll();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };
  },

  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
};

module.exports = UserModel;
