package org.sergiorebelo.playground.rest.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.sergiorebelo.playground.rest.client.ExternalApiService;

import java.util.Optional;

@ApplicationScoped
public class GreetingService {


    @Inject
    @RestClient
    ExternalApiService externalApiService;

    public String greeting(String name) {
        String gender = externalApiService.getResource(name).getGender();
        return "Hello " + name + ". Do you identify as " + Optional.ofNullable(gender).orElse("non binary") + "?";
    }
}
