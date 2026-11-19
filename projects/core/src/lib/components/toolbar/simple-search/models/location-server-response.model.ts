export interface LocationServerResponseModel {
  response: {
    docs: Array<{
      id: string;
      weergavenaam: string;
      geometrie_rd: string;
      centroide_rd: string;
      /** Only requested for kadastrale percelen. */
      kadastrale_gemeentenaam?: string;
    }>;
  };
}
