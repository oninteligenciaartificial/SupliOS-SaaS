# Guía de Migración: Dominio Propio para Emails

## Objetivo

Migrar de `oninteligenciaartificial@gmail.com` a `noreply@gestios.app` (o tu dominio) como remitente verificado en Brevo para mejorar entregabilidad y evitar spam.

---

## Paso 1: Comprar dominio

### Opciones recomendadas
| Proveedor | Precio anual | Notas |
|---|---|---|
| Namecheap | ~$12/año | Buen soporte, DNS incluido |
| Porkbun | ~$10/año | Interfaz simple, precios transparentes |
| Cloudflare | ~$9/año | DNS incluido, sin markup |

### Dominio sugerido
- `gestios.app` — limpio, profesional
- Alternativas: `gestios.io`, `gestios.co`, `gestios.dev`

---

## Paso 2: Configurar DNS

### Registros requeridos en Brevo

1. **SPF** (Sender Policy Framework)
   ```
   Type: TXT
   Host: @
   Value: v=spf1 include:spf.brevo.com ~all
   ```

2. **DKIM** (DomainKeys Identified Mail)
   ```
   Type: TXT
   Host: brevo._domainkey (Brevo te da el selector exacto)
   Value: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4...
   ```

3. **DMARC** (Domain-based Message Authentication)
   ```
   Type: TXT
   Host: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@gestios.app
   ```

### Pasos en tu proveedor DNS

1. Ir al panel DNS de tu dominio
2. Agregar los 3 registros TXT arriba
3. Esperar propagación (5 min - 48 hrs)

---

## Paso 3: Verificar dominio en Brevo

1. Ir a https://app.brevo.com
2. **Settings** → **Sender & IPs** → **Domains**
3. Click **Add a Domain**
4. Ingresar `gestios.app`
5. Brevo te dará los registros DNS exactos (SPF, DKIM, DMARC)
6. Agregarlos en tu panel DNS
7. Click **Verify** en Brevo
8. Esperar verificación (puede tardar hasta 48 hrs)

---

## Paso 4: Verificar dirección de envío

1. **Settings** → **Sender & IPs** → **Senders**
2. Click **Add a Sender**
3. Email: `noreply@gestios.app`
4. Name: `GestiOS`
5. Brevo enviará email de verificación a esa dirección
6. Click en link de verificación

---

## Paso 5: Actualizar Vercel

Ir a Vercel Dashboard → Proyecto → Settings → Environment Variables:

| Variable | Valor anterior | Nuevo valor |
|---|---|---|
| `BREVO_SENDER_EMAIL` | `oninteligenciaartificial@gmail.com` | `noreply@gestios.app` |
| `BREVO_SENDER_NAME` | `GestiOS` | `GestiOS` (sin cambio) |

Deploy para aplicar cambios:
```bash
npx vercel --prod --yes
```

---

## Paso 6: Verificar funcionamiento

1. Crear una orden de prueba en GestiOS
2. Verificar que el email llegue a la bandeja de entrada (no spam)
3. Revisar `EmailLog` en la base de datos para confirmar `status: "SENT"` y `status: "DELIVERED"`

### Comandos útiles

```bash
# Ver últimos emails enviados
npx prisma studio

# Ver logs de emails fallidos
npx prisma db query --command "SELECT * FROM email_logs WHERE status = 'FAILED' ORDER BY createdAt DESC LIMIT 10"
```

---

## Paso 7: Configurar webhook de Brevo

1. Ir a Brevo → **Settings** → **Webhooks**
2. Click **Add a Webhook**
3. URL: `https://gestios.app/api/webhooks/brevo`
4. Seleccionar eventos:
   - ✅ delivered
   - ✅ bounce
   - ✅ blocked
   - ✅ spam
5. Agregar `BREVO_WEBHOOK_KEY` en Vercel (string aleatorio largo)
6. Guardar

---

## Troubleshooting

### Email va a spam
- Verificar que SPF, DKIM y DMARC estén configurados correctamente
- Usar https://www.mail-tester.com para verificar score
- Revisar que el dominio no esté en blacklists

### Brevo no verifica el dominio
- Esperar propagación DNS (puede tardar 48 hrs)
- Verificar registros con `dig TXT gestios.app`
- Contactar soporte de Brevo si persiste

### DMARC p=reject demasiado agresivo
- Empezar con `p=none` para monitorear
- Cambiar a `p=quarantine` después de 1 semana
- Cambiar a `p=reject` después de 2 semanas sin problemas

---

## Checklist final

- [ ] Dominio comprado
- [ ] SPF configurado
- [ ] DKIM configurado
- [ ] DMARC configurado
- [ ] Dominio verificado en Brevo
- [ ] Email `noreply@gestios.app` verificado
- [ ] Vercel actualizado con nuevas variables
- [ ] Deploy realizado
- [ ] Email de prueba recibido en inbox (no spam)
- [ ] Webhook configurado en Brevo
- [ ] `BREVO_WEBHOOK_KEY` configurado en Vercel
