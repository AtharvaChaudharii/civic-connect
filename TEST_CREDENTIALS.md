# 🔐 CivicConnect Test Credentials

## Login Credentials

All test accounts use the same password: **`password123`**

### 👤 Citizen Accounts

| Email | Password | City | Name |
|-------|----------|------|------|
| `citizen@civictrack.in` | `password123` | Pune | Aarav Sharma |
| `priya@civictrack.in` | `password123` | Pune | Priya Deshmukh |
| `arjun@civictrack.in` | `password123` | Mumbai | Arjun Patel |

### 🏢 Department Accounts (Pune)

| Email | Password | Department | Category |
|-------|----------|------------|----------|
| `sanitation@pune.gov.in` | `password123` | Sanitation | Garbage |
| `roads@pune.gov.in` | `password123` | Roads & Infrastructure | Pothole |
| `water@pune.gov.in` | `password123` | Water Supply | Water Overflow |
| `electrical@pune.gov.in` | `password123` | Electrical | Street Light |

### 🏛️ Municipal Corporation Accounts

| Email | Password | City | Role |
|-------|----------|------|------|
| `admin@pmc.gov.in` | `password123` | Pune | Municipal Admin |
| `admin@bmc.gov.in` | `password123` | Mumbai | Municipal Admin |

---

## Quick Test Steps

### Test Citizen Flow:
1. Login with: `citizen@civictrack.in` / `password123`
2. View dashboard with issues
3. Report a new issue
4. Upvote and comment on issues

### Test Department Flow:
1. Login with: `sanitation@pune.gov.in` / `password123`
2. View assigned tickets
3. Update ticket status
4. Upload resolution proof
5. Add department comments

### Test Municipal Flow:
1. Login with: `admin@pmc.gov.in` / `password123`
2. View city overview with stats
3. Monitor department performance
4. Handle escalated issues
5. Export reports

---

## 🔄 Reset Database (if needed)

If you need to reset the database to its initial state:

```bash
cd backend
npx prisma migrate reset --force
npx tsx prisma/seed.ts
```

This will:
1. Drop all tables
2. Run all migrations
3. Seed with test data

---

## 🆕 Create New Account

You can also register a new citizen account:
1. Go to `/register`
2. Fill in the form
3. Choose your city
4. Login with your new credentials

---

## 🐛 Troubleshooting

### "Invalid email or password" error:
- **Solution**: The database was reset. Run the seed script:
  ```bash
  cd backend && npx tsx prisma/seed.ts
  ```

### "User not found" after login:
- **Solution**: Check if backend is running on port 5000
  ```bash
  lsof -ti:5000
  ```

### Can't connect to database:
- **Solution**: Check DATABASE_URL in `.env` file
- Verify Neon database is accessible

---

**Ready to test! Use any of the credentials above to login.** 🚀
