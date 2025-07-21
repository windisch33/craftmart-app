# Cloudflare Tunnel Setup Guide for CraftMart App

## Overview
This guide explains how to set up Cloudflare Tunnel to securely expose your CraftMart application via www.cmioe.com without opening ports on your server.

## Prerequisites
- Cloudflare account with your domain (cmioe.com) added
- Docker and Docker Compose installed
- CraftMart application running locally

## Step 1: Create Cloudflare Tunnel

1. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Zero Trust** → **Networks** → **Tunnels**
3. Click **Add a Tunnel** 
4. Choose **Cloudflared**
5. Enter a name for your tunnel (e.g., "craftmart-tunnel")
6. Click **Save tunnel**
7. Copy the tunnel token that appears (starts with "eyJ...")

## Step 2: Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your tunnel token:
   ```bash
   TUNNEL_TOKEN=eyJhIjoiYWJjZGVmZ2hpams...your_actual_token_here
   ```

## Step 3: Configure DNS Records

In the Cloudflare Dashboard:

1. Go to **DNS** → **Records**
2. Add a CNAME record:
   - **Type**: CNAME
   - **Name**: www
   - **Target**: [tunnel-id].cfargotunnel.com
   - **Proxy status**: Proxied (orange cloud)

Optional: Add subdomain for API access:
- **Type**: CNAME  
- **Name**: api
- **Target**: [tunnel-id].cfargotunnel.com
- **Proxy status**: Proxied (orange cloud)

## Step 4: Start the Application

1. Start all services including the tunnel:
   ```bash
   docker-compose up -d
   ```

2. Check tunnel status:
   ```bash
   docker-compose logs cloudflared
   ```

3. Verify the tunnel is connected in the Cloudflare Dashboard

## Step 5: Test Access

1. Open your browser and navigate to https://www.cmioe.com
2. You should see the CraftMart application
3. Verify login functionality works properly
4. Test API endpoints if using api.cmioe.com subdomain

## Security Benefits

With Cloudflare Tunnel enabled:
- ✅ No open ports on your server (3000, 3001 are no longer exposed)
- ✅ SSL/TLS encryption handled automatically by Cloudflare
- ✅ DDoS protection from Cloudflare's global network
- ✅ Zero-trust security model
- ✅ Traffic routed through Cloudflare's optimized network

## Troubleshooting

### Tunnel Not Connecting
- Check that TUNNEL_TOKEN is correctly set in .env
- Verify the token hasn't expired
- Check Docker logs: `docker-compose logs cloudflared`

### DNS Not Resolving
- Ensure CNAME record points to correct tunnel domain
- Allow 5-10 minutes for DNS propagation
- Use `dig www.cmioe.com` to verify DNS resolution

### Application Not Loading
- Verify all containers are running: `docker-compose ps`
- Check that frontend service is accessible from cloudflared container
- Review ingress rules in `cloudflared/config.yml`

### SSL Certificate Issues
- Cloudflare handles SSL automatically for proxied domains
- Ensure orange cloud is enabled in DNS settings
- Check SSL/TLS encryption mode is "Full" or "Full (strict)"

## Configuration Files

### Docker Compose Changes
The `docker-compose.yml` now includes:
- Cloudflared service with tunnel configuration
- Removed exposed ports for security (frontend/backend)
- Internal networking between services

### Tunnel Configuration
The `cloudflared/config.yml` defines:
- Hostname routing rules
- Service endpoints
- Catch-all error handling

## Monitoring

### Cloudflare Analytics
- View traffic analytics in Cloudflare Dashboard
- Monitor tunnel health and performance
- Set up alerts for tunnel disconnections

### Container Logs
```bash
# View tunnel logs
docker-compose logs -f cloudflared

# View all service logs
docker-compose logs -f
```

## Advanced Configuration

### Custom Subdomains
Edit `cloudflared/config.yml` to add more routing rules:

```yaml
ingress:
  - hostname: admin.cmioe.com
    service: http://backend:3001/admin
  - hostname: reports.cmioe.com
    service: http://frontend:3000/reports
  # ... existing rules
```

### Health Checks
The tunnel includes metrics endpoint on port 2000 for monitoring.

### Load Balancing
For high availability, you can create multiple tunnels and use Cloudflare Load Balancing.

## Production Considerations

1. **Environment Variables**: Use secure methods to manage TUNNEL_TOKEN in production
2. **Monitoring**: Set up alerts for tunnel health and performance
3. **Backup Tunnels**: Consider multiple tunnels for high availability
4. **Access Policies**: Use Cloudflare Access for additional authentication layers
5. **Rate Limiting**: Configure Cloudflare rate limiting rules if needed

## Support

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- CraftMart App Issues: Check application logs and container health