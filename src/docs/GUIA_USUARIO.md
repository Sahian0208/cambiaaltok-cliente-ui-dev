# Guía del Usuario — CambiaAltok

## Introducción

CambiaAltok es una plataforma de cambio de divisas entre Bolivia (BOB) y Perú (PEN). Permite enviar y recibir dinero entre ambos países de forma segura, con tasas de cambio en tiempo real y verificación por un intermediario.

---

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| **Cliente** | Persona que realiza transferencias de dinero entre Bolivia y Perú |
| **Intermediario** | Persona que verifica depósitos y ejecuta transferencias hacia los clientes |
| **Administrador** | Gestiona la configuración del sistema (tasas, bancos, usuarios) |

---

## Flujo del Cliente

### 1. Inicio de Sesión

1. Ingresa a la aplicación y presiona **"Iniciar Sesión"**
2. Serás redirigido a la pantalla de autenticación segura
3. Ingresa tu email y contraseña
4. Tras autenticarte, serás redirigido a tu **Dashboard**

### 2. Registro de Cuentas Bancarias

Antes de hacer una transferencia, necesitas registrar tus cuentas:

1. Ve a **Cuentas** en el menú lateral
2. Presiona **"Nueva Cuenta"**
3. Selecciona:
   - **País** (Bolivia o Perú)
   - **Tipo**: Origen (desde donde depositas) o Destino (donde recibes)
   - **Banco** de la lista disponible
   - **Número de cuenta** y **nombre del titular**
4. Si es una cuenta en Perú tipo destino, puedes marcarla como **Yape**
5. Presiona **"Crear Cuenta"**

### 3. Crear una Transferencia (Paso 1)

1. Ve a **Transferencia** o presiona **"Nueva Transferencia"** en el dashboard
2. En la sección **"¿Cuánto deseas enviar?"**:
   - Ingresa el monto
   - Selecciona la moneda (BOB o PEN)
   - Verás automáticamente el monto que recibirás según la tasa actual
3. **Cupón (opcional)**: Si tienes un código de cupón, presiona **"Tengo un cupón"**, ingresa el código y presiona **"Validar"**. Si es válido, verás un monto adicional sumado a lo que recibes
4. Selecciona tu **cuenta de origen** y **cuenta de destino** (puedes crear una nueva directamente aquí)
5. Sube el **QR de tu cuenta destino** (imagen PNG/JPG, máximo 5 MB)
6. Presiona **"Registrar Operación"**

### 4. Depósito al Intermediario (Paso 2)

1. Se muestra el **QR del intermediario**
2. Escanea el QR con tu app bancaria y realiza el depósito
3. Toma una captura/foto del comprobante
4. Sube el comprobante en la aplicación
5. Presiona **"Enviar Comprobante"**
6. Tu operación pasa a estado **"Pendiente de verificación"**

### 5. Esperando Verificación (Paso 3)

- El intermediario revisará tu comprobante
- Recibirás una notificación cuando sea verificado
- Puedes ver el estado en tu dashboard

### 6. Transferencia en Proceso (Paso 4)

- El intermediario ya confirmó tu depósito y está enviando el dinero a tu cuenta destino
- Recibirás una notificación cuando se complete

### 7. Operación Completada (Paso 5)

- Tu transferencia fue completada exitosamente
- Puedes ver y descargar el comprobante de transferencia del intermediario
- La operación aparece como **"Finalizada"** en tu historial

### 8. Operación Denegada

Si el intermediario deniega tu depósito:
- Verás el motivo del rechazo
- Puedes iniciar una nueva transferencia

---

## Flujo del Intermediario

### 1. Panel Principal

Al ingresar verás:
- **Tarjetas de resumen**: Cantidad de operaciones por verificar, por transferir y total
- **Barra de búsqueda**: Busca por nombre del cliente
- **Filtros**: Filtra por estado (Todas, Por verificar, Por transferir)
- **Lista de transacciones**: Cada tarjeta muestra el cliente, montos y estado

### 2. Verificar un Depósito

1. Toca la tarjeta de una transacción con estado **"Por verificar"**
2. Verás:
   - Resumen de la operación (montos, tasa, fecha)
   - El comprobante que subió el cliente
   - Guía de qué hacer
3. Si el depósito se recibió correctamente:
   - Presiona **"Confirmar Depósito"**
   - Confirma en el diálogo de seguridad
4. Si el depósito NO se recibió o hay problemas:
   - Presiona **"Denegar"**
   - Escribe el motivo del rechazo
   - Presiona **"Confirmar Denegación"**

### 3. Realizar la Transferencia

1. Toca la tarjeta de una transacción con estado **"Por transferir"**
2. Verás:
   - Los datos de la cuenta destino del cliente
   - El monto que debes transferir
   - El QR de la cuenta destino del cliente
3. Realiza la transferencia usando el QR o los datos bancarios
4. Toma una captura del comprobante
5. Sube el comprobante en la aplicación
6. Presiona **"Completar Transferencia"**
7. Confirma en el diálogo de seguridad
8. La operación se marca como **"Finalizada"**

---

## Flujo del Administrador

### 1. Gestión de Tasas de Cambio

- Ve a **Tasas** en el menú lateral
- La tasa se actualiza automáticamente desde fuentes externas cada 5 minutos
- Puedes **establecer una tasa manual** que sobreescribe la tasa automática
- Para volver a la tasa automática, desactiva la tasa manual

### 2. Gestión de Bancos

- Ve a **Bancos** en el menú lateral
- Puedes **agregar nuevos bancos** para Bolivia o Perú
- Puedes **editar** el nombre o datos de un banco
- Puedes **activar/desactivar** bancos (los inactivos no aparecen para los clientes)

### 3. Gestión de Usuarios

- Ve a **Usuarios** en el menú lateral
- Visualiza todos los usuarios registrados con sus datos y rol
- Puedes **cambiar el rol** de un usuario entre Cliente e Intermediario

---

## Sistema de Cupones

Los cupones son beneficios que el administrador asigna a clientes específicos:

- **¿Qué es un cupón?** Un código que te da un monto adicional en tu transferencia
- **¿Cómo lo uso?** En el Paso 1 de la transferencia, presiona "Tengo un cupón" e ingresa el código
- **¿Cuándo se aplica?** El valor del cupón se suma al monto que recibes
- **¿Se puede usar más de una vez?** No, cada cupón es de un solo uso
- **Motivos comunes**: Cliente fiel, fiestas patrias, incentivo especial

---

## Estados de una Transferencia

| Estado | Significado | ¿Quién actúa? |
|--------|-------------|----------------|
| Pendiente de depósito | Esperando que el cliente deposite al intermediario | Cliente |
| Pendiente de verificación | El intermediario debe revisar el comprobante | Intermediario |
| Verificado | Depósito confirmado, intermediario debe transferir | Intermediario |
| Finalizado | Operación completada exitosamente | — |
| Denegado | El intermediario rechazó el depósito | — |

---

## Preguntas Frecuentes

**¿Cuánto tarda una transferencia?**
Depende de la velocidad de verificación del intermediario. Normalmente se completa en pocos minutos.

**¿Qué pasa si me equivoco en el monto?**
Debes iniciar una nueva operación con el monto correcto.

**¿Puedo cancelar una transferencia?**
Una vez registrada, no se puede cancelar. Si hay un problema, el intermediario puede denegarla.

**¿Qué formatos acepta para los comprobantes y QR?**
PNG, JPG o JPEG, con un tamaño máximo de 5 MB.

**¿Cómo obtengo un cupón?**
Los cupones son asignados por el administrador del sistema. Si tienes uno, recibirás el código por email o mensaje.

---

## Cerrar Sesión

Presiona **"Cerrar Sesión"** en el menú lateral o en el header. Se cerrará tu sesión de forma segura y serás redirigido a la página de inicio.
