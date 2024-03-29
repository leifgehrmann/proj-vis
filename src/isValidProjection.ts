import proj4 from 'proj4';

function localTest(projection: string): void {
  const transformer = proj4(projection);
  transformer.forward([0, 0]);
}

async function remoteTest(projection: string, remoteUrl: string): Promise<void> {
  const urlWithParams = new URL(remoteUrl);

  urlWithParams.searchParams.append('projTo', projection);
  urlWithParams.searchParams.append('x', '0');
  urlWithParams.searchParams.append('y', '0');

  await fetch(urlWithParams)
    .then(async (response) => {
      if (!response.ok) {
        const errorMessage = await response.json();
        const regex = /\(Internal Proj Error: (.*)\)/;
        const foundErrorMessage = errorMessage.match(regex);
        if (foundErrorMessage[1]) {
          throw new Error(foundErrorMessage[1]);
        } else {
          throw new Error(errorMessage);
        }
      }
      return response.json();
    });
}

export default async function isValidProjection(
  projection: string,
  remoteUrl: string | null,
): Promise<{ valid: boolean, message: string | null }> {
  try {
    if (remoteUrl === null) {
      localTest(projection);
    } else {
      await remoteTest(projection, remoteUrl);
    }
    return { valid: true, message: null };
  } catch (e) {
    return { valid: false, message: (e as Error).message };
  }
}
