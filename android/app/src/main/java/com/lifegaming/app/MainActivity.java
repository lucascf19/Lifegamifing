package com.lifegaming.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // ESTA LINHA LIBERA O CHROME INSPECT
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
