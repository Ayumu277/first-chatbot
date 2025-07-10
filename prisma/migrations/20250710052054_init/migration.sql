BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [name] NVARCHAR(1000),
    [image] NVARCHAR(1000),
    [isGuest] BIT NOT NULL CONSTRAINT [users_isGuest_df] DEFAULT 0,
    [guestToken] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [users_guestToken_key] UNIQUE NONCLUSTERED ([guestToken])
);

-- CreateTable
CREATE TABLE [dbo].[chat_sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [chat_sessions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [chat_sessions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[chat_messages] (
    [id] NVARCHAR(1000) NOT NULL,
    [sessionId] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [chat_messages_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [imageBase64] NVARCHAR(max),
    [imagePreview] NVARCHAR(max),
    CONSTRAINT [chat_messages_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[chat_sessions] ADD CONSTRAINT [chat_sessions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[chat_messages] ADD CONSTRAINT [chat_messages_sessionId_fkey] FOREIGN KEY ([sessionId]) REFERENCES [dbo].[chat_sessions]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
