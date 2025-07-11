-- CreateTable
CREATE TABLE [dbo].[email_verification_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [expires] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [email_verification_tokens_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [used] BIT NOT NULL CONSTRAINT [email_verification_tokens_used_df] DEFAULT 0,
    CONSTRAINT [email_verification_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [email_verification_tokens_token_key] UNIQUE NONCLUSTERED ([token])
);

-- AddColumn
ALTER TABLE [dbo].[users] ADD [password] NVARCHAR(1000);