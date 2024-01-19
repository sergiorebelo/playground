package org.sergiorebelo.playground;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class NameInformationService {


    @Inject
    GenderInformationFacade genderInformationFacade;

    public GenderInformationFacade.Gender getGender(String name) {
        return genderInformationFacade.getGenderForName(name);
    }
}