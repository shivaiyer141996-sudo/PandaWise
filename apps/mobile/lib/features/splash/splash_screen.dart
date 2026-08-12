import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/widgets/pando_brand.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                PandoBrand(),
                SizedBox(height: 40),
                CircularProgressIndicator(),
                SizedBox(height: 12),
                Text('Preparing your family journey…'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
