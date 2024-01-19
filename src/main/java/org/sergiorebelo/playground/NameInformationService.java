package org.sergiorebelo.playground;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.sergiorebelo.playground.rest.client.ExternalGenderApiService;

@ApplicationScoped
public class NameInformationService {

    @Inject
    @RestClient
    ExternalGenderApiService externalGenderApiService;

    public String getGender(String name) {
        return externalGenderApiService.getResource(name).getGender();
    }
}