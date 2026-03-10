// src/Utils/PermissionHelper.js

export const RIGHTS = {
  CREATE: '[A-Z]*[C][A-Z]*',
  READ: '[A-Z]*[R][A-Z]*',
  UPDATE: '[A-Z]*[U][A-Z]*',
  DELETE: '[A-Z]*[D][A-Z]*',
};

export const MOD = {
  URD: '^(URD)[.]', SFD: '^(SFD)[.]', BILL: '^(BILL)[.]', PMT: '^(PMT)[.]',
  MTR: '^(MTR)[.]', COM: '^(COM)[.]', SMS: '^(SMS)[.]', NTC: '^(NTC)[.]',
  MSG: '^(MSG)[.]', DSB: '^(DSB)[.]', PRF: '^(PRF)[.]', ACL: '^(ACL)[.]',
  STG: '^(STG)[.]', URG: '^(URG)[.]', VMS: '^(VMS)[.]', ICH: '^(ICH)[.]',
  TRF: '^(TRF)[.]', BCYL: '^(BCYL)[.]', CSR: '^(CSR)[.]', ASNCOM: '^(ASNCOM)[.]',
  COMJC: '^(COMJC)[.]', TFRCOM: '^(TFRCOM)[.]', OBT: '^(OBT)[.]', UACT: '^(UACT)[.]',
  MTRRDG: '^(MTRRDG)[.]', CHKBNC: '^(CHKBNC)[.]', ORGSTR: '^(ORGSTR)[.]', EML: '^(EML)[.]',
  GNP: '^(GNP)[.]', MKTPLC: '^(MKTPLC)[.]', VMSSTF: '^(VMSSTF)[.]', BLRPT: '^(BLRPT)[.]',
  BLNRPT: '^(BLNRPT)[.]', CMRPT: '^(CMRPT)[.]', ADVCH: '^(ADVCH)[.]', DBTCRT: '^(DBTCRT)[.]',
  CHQPRK: '^(CHQPRK)[.]', DOC: '^(DOC)[.]', FBK: '^(FBK)[.]', FAC: '^(FAC)[.]',
  FMB: '^(FMB)[.]', ISMSTF: '^(ISMSTF)[.]', NTFSTG: '^(NTFSTG)[.]', SUSPND: '^(SUSPND)[.]',
  GENSER: '^(GENSER)[.]', EXPUSR: '^(EXPUSR)[.]', BILPRO: '^(BILPRO)[.]', BILTYP: '^(BILTYP)[.]',
  BILTYPUSR: '^(BILTYPUSR)[.]', MTRACT: '^(MTRACT)[.]', IER: '^(IER)[.]', DSBCHRT: '^(DSBCHRT)[.]',
  ACONT: '^(ACONT)[.]', TARNS: '^(TARNS)[.]', TRRPT: '^(TRRPT)[.]', COMESC: '^(COMESC)[.]',
  SAPACC: '^(SAPACC)[.]', CHPW: '^(CHPW)[.]', USRDTL: '^(USRDTL)[.]', SEQ: '^(SEQ)[.]',
  TMP: '^(TMP)[.]', CANPMT: '^(CANPMT)[.]', CANBIL: '^(CANBIL)[.]', RESDSB: '^(RESDSB)[.]',
  TENMGT: '^(TENMGT)[.]', PNC: '^(PNC)[.]', FRZ: '^(FRZ)[.]', CUSRPT: '^(CUSRPT)[.]',
  APPR: '^(APPR)[.]', COMREP: '^(COMREP)[.]', COMVSTTM: '^(COMVSTTM)[.]', MYSOC: '^(MYSOC)[.]',
  PDFREGEN: '^(PDFREGEN)[.]', ADVTS: '^(ADVTS)[.]', CRPMT: '^(CRPMT)[.]', DRPMT: '^(DRPMT)[.]',
  PMTREQ: '^(PMTREQ)[.]', CUSREM: '^(CUSREM)[.]', PMTRECON: '^(PMTRECON)[.]', UNITREM: '^(UNITREM)[.]',
  OUTSND: '^(OUTSND)[.]', BILLAGE: '^(BILLAGE)[.]', PPM: '^(PPM)[.]', PPMTSK: '^(PPMTSK)[.]',
  PPMASST: '^(PPMASST)[.]', PPMRDG: '^(PPMRDG)[.]', PPMALRT: '^(PPMALRT)[.]', INVT: '^(INVT)[.]',
  COMSUBOTH: '^(COMSUBOTH)[.]', RESHOMAWY: '^(RESHOMAWY)[.]', AOACOM: '^(AOACOM)[.]', 
  COMFRCCLS: '^(COMFRCCLS)[.]', SURVEY: '^(SURVEY)[.]', VEH: '^(VEH)[.]', MPN: '^(MPN)[.]',
  IVRDIS: '^(IVRDIS)[.]', UAT: '^(UAT)[.]', GSTPRK: '^(GSTPRK)[.]', REFR: '^(REFR)[.]',
  VMSPAS: '^(VMSPAS)[.]', EVNT: '^(EVNT)[.]', MTRBAL: '^(MTRBAL)[.]', VHCLNO: '^(VHCLNO)[.]'
};

/**
 * Replicates the Angular PermissionCheckPipe logic.
 * @param {Array|string} input - User permissions (e.g., ['BILL.R', 'URD.C'])
 * @param {string} type - Module key from MOD
 * @param {string} per - Action key from RIGHTS
 */
export const hasPermission = (input, type, per) => {
  if (!input || !MOD[type] || !RIGHTS[per]) return false;
  
  const regexStr = `${MOD[type]}+${RIGHTS[per]}`;
  const patt = new RegExp(regexStr);

  // If input is an array, check if any element matches
  if (Array.isArray(input)) {
    return input.some(p => patt.test(p));
  }
  
  // If input is a string (e.g. comma separated), split it or test directly
  return patt.test(input);
};