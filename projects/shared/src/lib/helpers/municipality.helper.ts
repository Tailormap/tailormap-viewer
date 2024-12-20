import { BehaviorSubject, from } from 'rxjs';

export interface MunicipalityModel {
  municipalityCode: string;
  municipality: string;
  provinceCode: string;
  province: string;
}

export class MunicipalityHelper {

  private static fetchedList = false;
  private static municipalityList = new BehaviorSubject<MunicipalityModel[]>([]);

  public static getDutchMunicipalities$() {
    if (!MunicipalityHelper.fetchedList) {
      MunicipalityHelper.fetchedList = true;
      from(import('../../../assets/dutch_municipalities.json'))
        .subscribe(data =>{
          MunicipalityHelper.municipalityList.next(data.default.sort((a, b) => a.municipality.localeCompare(b.municipality)));
        });
    }
    return MunicipalityHelper.municipalityList.asObservable();
  }

  public static isMunicipalityModel(municipality: MunicipalityModel | any): municipality is MunicipalityModel {
    return !!municipality && typeof (municipality as MunicipalityModel).municipalityCode !== "undefined";
  }

}
