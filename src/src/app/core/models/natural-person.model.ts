
export interface NaturalPerson {
    id: number;
    personId: number;             
    person: string;
    firstName: string;
    lastName?: string;
    middleName?: string;
    fullName?: string;
    documentNumber?: string;
    birthDate: string; // ISO date
    countryOfBirthId: number;
    countryOfBirth: string;
    genderId: number;
    gender: string;
    nickName?: string;        

    pictureFileExternalId?: string;
    signatureFileExternalId?: string;
    frontDocumentFileExternalId?: string;
    backDocumentFileExternalId?: string;
    videoDocumentFileExternalId?: string;

    userName?: string;
    authUserId?: string;
    lastUpdate?: string; // ISO date
    isRegistrationCompleted: boolean;
    livesInCountryId: number;
    livesInCountry: string;
    isPEP: boolean;
    occupation?: string;
    referralSource?: string;
    email: string;
    creationDate: string; // ISO date

    customerType: 'Persona' | 'Empresa';
    webUrl?: string;
    name?: string;
    legalDocumentFileExternalId?: string;
    legalRepresentativeName?: string;
    phoneNumber?: string;
}

export interface NaturalPersonClientDto {
    id: number;
    firstName: string;
    lastName?: string;
    middleName?: string;
    documentNumber?: string;
    birthDate: string; // ISO date
    nickName?: string;
    email: string;
    lastUpdate?: string; // ISO date
    pictureFileExternalId?: string;
    signatureFileExternalId?: string;
    frontDocumentFileExternalId?: string;
    backDocumentFileExternalId?: string;
    identityVideoFileExternalId?: string;
    countryOfBirthId: number;
    genderId: number;
    personId: number;
    creationDate: string; // ISO date
    livesInCountryId: number;
    isPEP: boolean;
    occupation?: string;
    referralSource?: string;
    phoneNumber?: string;
}

export interface NaturalAttachmentFieldDto{
    pictureAttachmentExternalId?: string;
    field: 'profile' | 'front-document' | 'back-document' | 'identity-video' | 'document';
}

export interface LegalPersonClientDto {
    id: number;
    personId: number;
    documentNumber?: string;
    livesInCountryId: number;
    webUrl?: string;
    name?: string;
    legalDocumentFileExternalId?: string;
    legalRepresentativeName?: string;
    phoneNumber?: string;
    pictureFileExternalId?: string;
    email?: string;
}