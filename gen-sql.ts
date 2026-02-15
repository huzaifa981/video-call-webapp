// Manual SQL generation for MSSQL
// (Drizzle Kit has bugs with MSSQL dialect)

console.log(`
-- MANUAL SQL FOR MSSQL --

CREATE TABLE [users] (
    [id] INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    [email] VARCHAR(255) NOT NULL UNIQUE,
    [password] VARCHAR(255) NOT NULL,
    [avatar_color] VARCHAR(50) DEFAULT '#000000' NOT NULL,
    [created_at] DATETIME2 DEFAULT GETDATE(),
    [last_seen] DATETIME2,
    [is_online] BIT DEFAULT 0 NOT NULL,
    [socket_id] VARCHAR(255)
);

CREATE TABLE [calls] (
    [id] INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    [caller_id] INT NOT NULL,
    [receiver_id] INT NOT NULL,
    [started_at] DATETIME2 DEFAULT GETDATE(),
    [ended_at] DATETIME2,
    [duration_seconds] INT,
    [recording_path] VARCHAR(1024)
);
`);

