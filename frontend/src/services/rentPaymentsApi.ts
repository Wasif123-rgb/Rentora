const API_URL = "/api";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface CreateRentPaymentData {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface FinalizeRentPaymentData {
  payment: {
    id: number;
    amount: number;
    payment_date: string;
    status: "paid" | "pending";
  };
}

function getToken(): string {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error(
      "Authentication token not found. Please log in again."
    );
  }

  return token;
}

async function parseResponse<T>(
  response: Response
): Promise<T> {
  let responseData: ApiResponse<T> | null = null;

  try {
    responseData = await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      responseData?.message ||
        "The server could not process the request."
    );
  }

  if (!responseData?.success) {
    throw new Error(
      responseData?.message ||
        "The payment request was unsuccessful."
    );
  }

  return responseData.data as T;
}

/*
|--------------------------------------------------------------------------
| Create Rent Payment
|--------------------------------------------------------------------------
|
| Creates a Stripe PaymentIntent for the tenant's
| current outstanding rent.
|
*/

export async function createRentPayment(): Promise<CreateRentPaymentData> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/tenant/rent-payment/create`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return parseResponse<CreateRentPaymentData>(
    response
  );
}

/*
|--------------------------------------------------------------------------
| Finalize Rent Payment
|--------------------------------------------------------------------------
|
| Laravel verifies the Stripe PaymentIntent and
| creates the RentPayment database record.
|
*/

export async function finalizeRentPayment(
  paymentIntentId: string
): Promise<FinalizeRentPaymentData> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/tenant/rent-payment/finalize`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
      }),
    }
  );

  return parseResponse<FinalizeRentPaymentData>(
    response
  );
}