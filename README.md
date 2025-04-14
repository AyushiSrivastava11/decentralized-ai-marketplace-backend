### 📦 Entity Overview

| Entity     | Description                                 |
|------------|---------------------------------------------|
| `User`     | Represents a user or developer              |
| `AIWorker` | An AI script or model deployed by a dev     |
| `Job`      | Tracks usage of AI Workers                  |
| `Review`   | User feedback for workers                   |
| `Admin`    | Superuser for platform management (optional)|

---

### 🛠️ Prisma Models

<details>
<summary><strong>1. User</strong></summary>

```prisma
model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          Role     @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  workers       AIWorker[]
  jobs          Job[]
  reviews       Review[]
}

enum Role {
  USER
  DEVELOPER
  ADMIN
}
```

</details>

<details>
<summary><strong>2. AIWorker</strong></summary>

```prisma
model AIWorker {
  id            String   @id @default(uuid())
  name          String
  description   String
  tags          String[]
  inputSchema   Json
  outputSchema  Json
  pricePerRun   Float    @default(0.0)
  isPublic      Boolean  @default(true)
  filePath      String

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  developer     User     @relation(fields: [developerId], references: [id])
  developerId   String

  jobs          Job[]
  reviews       Review[]
}
```

</details>

<details>
<summary><strong>3. Job</strong></summary>

```prisma
model Job {
  id          String    @id @default(uuid())
  input       Json
  output      Json?
  status      JobStatus @default(PENDING)
  startedAt   DateTime?
  finishedAt  DateTime?

  user        User     @relation(fields: [userId], references: [id])
  userId      String

  aiWorker    AIWorker @relation(fields: [aiWorkerId], references: [id])
  aiWorkerId  String
}

enum JobStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
}
```

</details>

<details>
<summary><strong>4. Review</strong></summary>

```prisma
model Review {
  id         String   @id @default(uuid())
  rating     Int      // 1 to 5
  comment    String?
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])
  userId     String

  aiWorker   AIWorker @relation(fields: [aiWorkerId], references: [id])
  aiWorkerId String
}
```

</details>

<details>
<summary><strong>5. Admin</strong></summary>

```prisma
model Admin {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      String   @default("ADMIN")
  createdAt DateTime @default(now())
}
```

</details>




