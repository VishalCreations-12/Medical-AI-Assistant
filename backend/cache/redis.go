package cache

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisCache struct {
	client *redis.Client
	prefix string
}

func NewRedisCache(addr string, password string, db int, prefix string) (*RedisCache, error) {
	if addr == "" {
		return nil, errors.New("redis address empty")
	}
	c := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := c.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	if prefix == "" {
		prefix = "mai:"
	}
	return &RedisCache{client: c, prefix: prefix}, nil
}

func (r *RedisCache) key(k string) string {
	return r.prefix + k
}

func (r *RedisCache) Get(key string) (any, bool) {
	ctx := context.Background()
	s, err := r.client.Get(ctx, r.key(key)).Result()
	if err != nil {
		return nil, false
	}
	var v any
	if err := json.Unmarshal([]byte(s), &v); err != nil {
		return s, true
	}
	return v, true
}

func (r *RedisCache) Set(key string, value any, ttl time.Duration) {
	ctx := context.Background()
	b, err := json.Marshal(value)
	if err != nil {
		return
	}
	r.client.Set(ctx, r.key(key), b, ttl)
}

func (r *RedisCache) Delete(key string) {
	ctx := context.Background()
	r.client.Del(ctx, r.key(key))
}
