To see 'En Çok Beğenilenler' on the homepage, ensure:
1) product_stats table exists and has data (likes > 0)
2) Or it will fall back to most recent products
3) Two-step fetch avoids requiring a FK relationship
