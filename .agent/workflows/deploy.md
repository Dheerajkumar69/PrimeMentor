---
description: Deploy PrimeMentor to Hostinger (backend VPS + frontend shared hosting)
---

# PrimeMentor Deployment

## Infrastructure

| Component | Type | Host | Details |
|---|---|---|---|
| **Backend** | Hostinger VPS (KVM 2) | `72.61.173.206` | Ubuntu 22.04, MERN Stack |
| **Frontend** | Hostinger Shared Hosting | `145.79.210.148:65002` | primementor.com.au |

## Credentials

### Backend VPS
- **SSH**: `ssh root@72.61.173.206`
- **Password**: `Primementor@315`
- **Project path**: `/var/www/primementor-project`
- **Process manager**: PM2 (`primementor-backend`)

### Frontend Shared Hosting
- **SSH**: `ssh -p 65002 u522868709@145.79.210.148`
- **Password**: `PrimeMentor@123`
- **Public HTML path**: `~/domains/primementor.com.au/public_html/`

### Production URLs
- **Frontend**: `https://primementor.com.au`
- **Backend API**: `https://api.primementor.com.au`

## Deploy Backend Only

// turbo-all

1. Push code to GitHub:
```bash
cd /home/dheeraj/Code/job/primementor/PrimeMentor && git add -A && git commit -m "update" && git push origin main
```

2. SSH into VPS and pull + restart:
```bash
sshpass -p 'Primementor@315' ssh -o StrictHostKeyChecking=no root@72.61.173.206 "cd /var/www/primementor-project && git pull origin main && cd backend && npm install --omit=dev && pm2 restart primementor-backend && sleep 2 && pm2 logs primementor-backend --lines 10 --nostream"
```

## Deploy Frontend Only

1. Push code to GitHub:
```bash
cd /home/dheeraj/Code/job/primementor/PrimeMentor && git add -A && git commit -m "update" && git push origin main
```

2. Build frontend on VPS:
```bash
sshpass -p 'Primementor@315' ssh -o StrictHostKeyChecking=no root@72.61.173.206 "cd /var/www/primementor-project && git pull origin main && cd frontend && npm install && npm run build"
```

3. Download dist from VPS to local:
```bash
rm -rf /tmp/pm-frontend-dist && mkdir -p /tmp/pm-frontend-dist && sshpass -p 'Primementor@315' scp -o StrictHostKeyChecking=no -r root@72.61.173.206:/var/www/primementor-project/frontend/dist/* /tmp/pm-frontend-dist/
```

4. Upload dist to shared hosting:
```bash
sshpass -p 'PrimeMentor@123' scp -o StrictHostKeyChecking=no -P 65002 -r /tmp/pm-frontend-dist/* u522868709@145.79.210.148:~/domains/primementor.com.au/public_html/
```

5. Ensure .htaccess exists for SPA routing:
```bash
sshpass -p 'PrimeMentor@123' ssh -o StrictHostKeyChecking=no -p 65002 u522868709@145.79.210.148 "cat ~/domains/primementor.com.au/public_html/.htaccess"
```

## Deploy Both (Full Deploy)

Run all steps from "Deploy Backend Only" then "Deploy Frontend Only".

## Check Server Status

```bash
sshpass -p 'Primementor@315' ssh -o StrictHostKeyChecking=no root@72.61.173.206 "pm2 list && pm2 logs primementor-backend --lines 20 --nostream"
```

## Rollback

```bash
sshpass -p 'Primementor@315' ssh -o StrictHostKeyChecking=no root@72.61.173.206 "cd /var/www/primementor-project && git log --oneline -5"
```
Then reset to a specific commit:
```bash
sshpass -p 'Primementor@315' ssh -o StrictHostKeyChecking=no root@72.61.173.206 "cd /var/www/primementor-project && git reset --hard <COMMIT_HASH> && cd backend && pm2 restart primementor-backend"
```
