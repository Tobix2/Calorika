
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { activateClientSlotAction } from '@/app/actions';

// This is a mock implementation of the webhook handler.
// In a real application, you would need to secure this endpoint,
// for example by verifying the signature of the request from Mercado Pago.

export async function POST(req: NextRequest) {
  console.log('--- Webhook de Mercado Pago recibido ---');
  try {
    const body = await req.json();
    console.log('Cuerpo del Webhook:', JSON.stringify(body, null, 2));

    // We are interested in preapproval (subscription) authorizations
    if (body.type === 'preapproval' && body.action === 'authorized') {
      const preapprovalId = body.data.id;
      
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
       if (!accessToken) {
            console.error('Webhook Error: MERCADOPAGO_ACCESS_TOKEN no está configurado.');
            return NextResponse.json({ status: 'error', message: 'Server configuration error' }, { status: 500 });
       }
      
      const client = new MercadoPagoConfig({ accessToken });
      const preapproval = new PreApproval(client);
      
      const subscriptionDetails = await preapproval.get({ preapprovalId });
      console.log('Detalles de la suscripción:', JSON.stringify(subscriptionDetails, null, 2));


      // Check if this is a subscription for a new client slot
      if (subscriptionDetails.metadata?.plan_type === 'professional_client') {
          const professionalId = subscriptionDetails.external_reference;

          if (!professionalId) {
              console.error(`Webhook Error: Falta professionalId (${professionalId}) en la metadata.`);
              return NextResponse.json({ status: 'error', message: 'Missing metadata' }, { status: 400 });
          }

          console.log(`Activando cupo para el profesional ${professionalId}`);
          
          const result = await activateClientSlotAction(professionalId);

          if (!result.success) {
               console.error(`Webhook Error: Falló la activación del cupo: ${result.error}`);
               // We still return 200 to MP so it doesn't retry, but log the error.
          } else {
               console.log(`✅ Cupo activado exitosamente por webhook.`);
          }
      } else {
         console.log('Webhook procesado: No es una suscripción de cliente profesional.');
      }
    } else {
       console.log(`Webhook ignorado: tipo '${body.type}', acción '${body.action}'`);
    }

    return NextResponse.json({ status: 'received' }, { status: 200 });

  } catch (error) {
    console.error('❌ Error procesando el webhook de Mercado Pago:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
  }
}
