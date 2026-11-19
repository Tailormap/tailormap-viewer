export interface LocationServerResponseModel {
  response: {
    docs: Array<{
      id: string;
      weergavenaam: string;
      geometrie_rd: string;
      centroide_rd: string;
    }>;
  };
}
